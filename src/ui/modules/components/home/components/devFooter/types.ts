import type { SimpleIcon } from "simple-icons";

interface SocialNetwork {
	USERNAME: string;
	BASE_URL: string;
	ICON: SimpleIcon;
}

type SocialNetworkSites = "github" | "bluesky" | "x" | "buy_me_a_coffee" | "kofi";

export type BaseSocialNetworks = Record<SocialNetworkSites, SocialNetwork>;
