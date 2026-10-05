import { render, waitFor } from "@testing-library/react";
import { LazyMotion } from "motion/react";
import { type ReactNode, StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnimateIcon, useAnimateIconContext } from "./Icon";

const FRAMES = 5;
const LOOP_DELAY_MS = 10;

const frames = async () => {
	for (let frame = 0; frame < FRAMES; frame++) await new Promise<void>((resolve) => setTimeout(resolve, 0));
};

const inMotion = (children: ReactNode) => (
	<LazyMotion features={async () => (await import("motion/react")).domAnimation}>{children}</LazyMotion>
);

const started = vi.fn<(animation: unknown) => void>();
const watched = new WeakSet<object>();

const WatchControls = () => {
	const { controls } = useAnimateIconContext();
	if (controls && !watched.has(controls)) {
		watched.add(controls);
		const start = controls.start.bind(controls);
		controls.start = (...args: Parameters<typeof controls.start>) => {
			started(args[0]);
			return start(...args);
		};
	}
	return null;
};

let unhandled: unknown[];
const onUnhandled = (reason: unknown) => unhandled.push(reason);

beforeEach(() => {
	started.mockClear();
	unhandled = [];
	process.on("unhandledRejection", onUnhandled);
});

afterEach(() => {
	process.off("unhandledRejection", onUnhandled);
});

describe("AnimateIcon against motion's own controls", () => {
	it("starts nothing on an icon that unmounted while its run was still in flight", async () => {
		const { unmount } = render(
			inMotion(
				<AnimateIcon animate>
					<span />
				</AnimateIcon>,
			),
		);

		unmount();
		await frames();

		expect(unhandled).toEqual([]);
	});

	it("starts nothing on an icon that unmounted mid-loop", async () => {
		const { unmount } = render(
			inMotion(
				<AnimateIcon animate loop loopDelay={LOOP_DELAY_MS}>
					<span />
				</AnimateIcon>,
			),
		);

		await frames();
		unmount();
		await frames();

		expect(unhandled).toEqual([]);
	});

	it("starts nothing on an icon that unmounted while it was sitting still", async () => {
		const { unmount } = render(
			inMotion(
				<AnimateIcon>
					<span />
				</AnimateIcon>,
			),
		);

		unmount();
		await frames();

		expect(unhandled).toEqual([]);
	});

	it("survives strict mode's mount, unmount and mount again, and an unmount after that", async () => {
		const { unmount } = render(
			<StrictMode>
				{inMotion(
					<AnimateIcon animate>
						<span />
					</AnimateIcon>,
				)}
			</StrictMode>,
		);

		await frames();
		unmount();
		await frames();

		expect(unhandled).toEqual([]);
	});

	it("still drives the controls for as long as the icon is on screen", async () => {
		render(
			inMotion(
				<AnimateIcon animate>
					<WatchControls />
				</AnimateIcon>,
			),
		);

		await waitFor(() => expect(started).toHaveBeenCalledWith("animate"));
		expect(unhandled).toEqual([]);
	});

	it("starts nothing more once it has unmounted, whatever its run had left to do", async () => {
		const { unmount } = render(
			inMotion(
				<AnimateIcon animate>
					<WatchControls />
				</AnimateIcon>,
			),
		);

		unmount();
		await frames();

		expect(started.mock.calls.map(([animation]) => animation)).toEqual(["animate"]);
		expect(unhandled).toEqual([]);
	});
});
