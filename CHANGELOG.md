## [1.8.1](https://github.com/fbuireu/forever-pto/compare/v1.8.0...v1.8.1) (2026-08-15)


### Bug Fixes

* **deps:** pin next to 16.2 and typescript to 6 until the adapter supports 16.3 ([#349](https://github.com/fbuireu/forever-pto/issues/349)) ([28ba47c](https://github.com/fbuireu/forever-pto/commit/28ba47c4e2f8db8659811b583fd342f5c1c3d5cd))
* **deps:** update astro monorepo ([#356](https://github.com/fbuireu/forever-pto/issues/356)) ([6f4e4e8](https://github.com/fbuireu/forever-pto/commit/6f4e4e874944010760ca28fc578e25052295dcf2))
* **markdown:** translate without next-intl/server so the Worker stops throwing ([#353](https://github.com/fbuireu/forever-pto/issues/353)) ([cd7049c](https://github.com/fbuireu/forever-pto/commit/cd7049c29105ced4d755ac3d670e6c377f7964db))

# [1.8.0](https://github.com/fbuireu/forever-pto/compare/v1.7.2...v1.8.0) (2026-08-13)


### Features

* add text-scale meta tag to page metadata ([543805d](https://github.com/fbuireu/forever-pto/commit/543805d7300314d10998aaf4b856d16b2c12fe13))

## [1.7.2](https://github.com/fbuireu/forever-pto/compare/v1.7.1...v1.7.2) (2026-08-07)


### Bug Fixes

* domain bugs ([40e1a65](https://github.com/fbuireu/forever-pto/commit/40e1a65ed083438d7a673e1e2e2bacda238610b9))
* skeletons + bump deps ([d40bc25](https://github.com/fbuireu/forever-pto/commit/d40bc2537b46c6ec5cd2c4b6850ce646abc954f1))

## [1.7.1](https://github.com/fbuireu/forever-pto/compare/v1.7.0...v1.7.1) (2026-08-04)


### Bug Fixes

* **ci:** make the deploy scripts runnable ([2028142](https://github.com/fbuireu/forever-pto/commit/2028142cf6704107911d2830d4032a73d4f2b25f))
* **ci:** unblock the production deploy by dropping --message ([10eb8ad](https://github.com/fbuireu/forever-pto/commit/10eb8ad89d850ec5b7c3dfaad110b1f19b1f62ec))
* **ci:** use an em dash in the deploy message, and drop the scripts that were not the fix ([c6a78ea](https://github.com/fbuireu/forever-pto/commit/c6a78ea4bedffbe35ffbf7428ceafaac15139ed8))
* **planner:** key Holiday selection on the Holiday, not on the row index ([dd2b618](https://github.com/fbuireu/forever-pto/commit/dd2b618b890c93e1d7e820bf66248cce2ae87f3e))

# [1.7.0](https://github.com/fbuireu/forever-pto/compare/v1.6.3...v1.7.0) (2026-08-04)


### Bug Fixes

* **build:** drop the route segment config cacheComponents rejects ([a60b962](https://github.com/fbuireu/forever-pto/commit/a60b96271634da619182871fc597c06abddb214e))
* **build:** repair the TypeScript 7 migration, which had broken every deploy ([64a7a91](https://github.com/fbuireu/forever-pto/commit/64a7a91ff0970c4a3700437b7e9ccdd4e161c02c))
* **checkout:** stop telling a charged payer their card was not charged ([c87f58c](https://github.com/fbuireu/forever-pto/commit/c87f58cb126ad48479496b92642c0ef7a96803bd))
* close the defects the guide sweep surfaced across the layers ([c15b7da](https://github.com/fbuireu/forever-pto/commit/c15b7da1a4019c5f5ba211e48eac6d601352a5db))
* close the no-comments rule's blind spot, and three more false-green test files ([ba9cf63](https://github.com/fbuireu/forever-pto/commit/ba9cf6371690e6dee08ea6d014e7fb5c33577218))
* **discovery:** stop advertising documents that 404, and fix the tutorial on mobile ([5170870](https://github.com/fbuireu/forever-pto/commit/5170870afcf50bce7ccf97a161d65c7d63a2e8c1))
* **export:** export the Planning Window, not the two years the store holds ([bfbade0](https://github.com/fbuireu/forever-pto/commit/bfbade0531e8836c58c173de58def3018ce3c5f0))
* **holidays:** recompute isInSelectedRange when the Planning Window moves ([dced0e0](https://github.com/fbuireu/forever-pto/commit/dced0e0f01a53051c896634210562065bb757440))
* **holidays:** refuse a Custom Holiday on a date already spent as a PTO day ([8db3b50](https://github.com/fbuireu/forever-pto/commit/8db3b5056c332af00091251358cf205c022f7afd))
* **hydration:** make the store-ready gate actually gate ([fce58f9](https://github.com/fbuireu/forever-pto/commit/fce58f9b357671a7475a203f049914acb14f1b79))
* **logging:** stop the BetterStack client throwing when it is unconfigured ([d2dbd19](https://github.com/fbuireu/forever-pto/commit/d2dbd19c987b6ac394e2cbf95fe5a45e8f763670))
* make Collapsible and Checkbox tests grade the component, not the mock ([61a554f](https://github.com/fbuireu/forever-pto/commit/61a554fd6fab7f11b9a153027668cf1fe6fa0c58))
* make three more tests able to fail, and correct four doc claims ([2709821](https://github.com/fbuireu/forever-pto/commit/2709821a8d88dc550ea416204413056bdd87168a))
* **metrics:** count a day off once when it arrives by both routes ([c7c19ac](https://github.com/fbuireu/forever-pto/commit/c7c19ace9e351f9453e3c0126694bee08658d8e7))
* **metrics:** measure only the Planning Window, and label the option being shown ([1a2d8c5](https://github.com/fbuireu/forever-pto/commit/1a2d8c5cd6ec4ad086d93299025aa1d63c66ba90))
* **payment:** activate premium when the payer returns from a redirect ([ce67800](https://github.com/fbuireu/forever-pto/commit/ce6780069393360f616cf7f183cd4c858f79a033))
* **payments:** refuse a fixed-amount coupon priced in another currency ([e683871](https://github.com/fbuireu/forever-pto/commit/e683871024bcfe3d8b83544300555f3afbb9fcef))
* **payment:** stop telling an unconfirmed payer their card was untouched ([d106518](https://github.com/fbuireu/forever-pto/commit/d106518b6571372eaf764732410f9f40815f9f34))
* **planner:** correct the Alternative apply, and revert the metrics window filter ([0d7c976](https://github.com/fbuireu/forever-pto/commit/0d7c9762322e71410aec962ec26d64cdec2d3f9c))
* **planner:** never spend PTO on a day that is already off ([8eb2baa](https://github.com/fbuireu/forever-pto/commit/8eb2baa2efd60c5758662b7a707fbcf55bf4988e))
* **planner:** prune hand-edited days when the planning window moves ([baf4d4d](https://github.com/fbuireu/forever-pto/commit/baf4d4db516bd7c077cc149cb0cf2320e1ba1842))
* **planner:** stop a hand-picked day from re-planning the whole year ([15ac93b](https://github.com/fbuireu/forever-pto/commit/15ac93b0ea1e58276e5b804832e9fb8ee22d24e0))
* **planner:** stop the empty-state guard hiding the panel on every cold load ([97024a3](https://github.com/fbuireu/forever-pto/commit/97024a3c2464e65cfbd12a170470373ab0f13eed))
* **planner:** stop the panel loading for ever when the plan is legitimately empty ([e8e052b](https://github.com/fbuireu/forever-pto/commit/e8e052b85ce5eb5f4d5d7124c6e342e74a19f783))
* **planner:** stop the planner re-planning itself, and land the plan that was previewed ([2f80000](https://github.com/fbuireu/forever-pto/commit/2f80000bcbcfaaf02f0ae4ac20d5fd5de3b4c954))
* **planner:** three counts and states the screen was getting wrong ([b81714c](https://github.com/fbuireu/forever-pto/commit/b81714c6bd32ec38ab628b5e7a3afdfb134966ce))
* **premium:** compare payer addresses normalised, not raw ([7532dc2](https://github.com/fbuireu/forever-pto/commit/7532dc2478735b78a8f0d88b75dde283e25f0221))
* **premium:** let a redirect payer's cookie reach the store, and stop freezing the planner ([3ff01a4](https://github.com/fbuireu/forever-pto/commit/3ff01a4e0ef0938552631bfd9b66ce7d77ea46cc))
* **seo:** stop asserting a price Premium does not have, and an FAQ the planner does not show ([50c80b7](https://github.com/fbuireu/forever-pto/commit/50c80b7febc83ba3d66e0039b3d47c705987efe7))
* **sidebar:** keep the budget consistent whichever control writes it ([75e7f5a](https://github.com/fbuireu/forever-pto/commit/75e7f5ab152d6a8a2d4de5b4e8699be97e738233))
* **troubleshooting:** reset the filters store the button promised to reset ([91cf38f](https://github.com/fbuireu/forever-pto/commit/91cf38f2189e17b236817d88528c1cb56e4ecd48))
* **tutorial:** stop the unmount cleanup throwing into an unhandled rejection ([84a4f63](https://github.com/fbuireu/forever-pto/commit/84a4f63741b1fe2f27516ff9b6fcffaa79d9467f))
* **tutorial:** wait for the anchor to stop moving, and finish the glossary rename ([e975ca2](https://github.com/fbuireu/forever-pto/commit/e975ca2ac611c26813f73fa3b02f39ab1a8c3242))


### Features

* **metrics:** bucket the distributions by the Planning Window ([2b842cb](https://github.com/fbuireu/forever-pto/commit/2b842cb073f98f48949310e5e03f0a7293c9a419))
* **payments:** enforce promotion-code redemption caps from our own records ([78dda70](https://github.com/fbuireu/forever-pto/commit/78dda702d2ad4b81c1adff9e3070af41b7be5608))
* **planner:** re-plan when a plan is applied, so hand edits stay consistent ([edf6560](https://github.com/fbuireu/forever-pto/commit/edf6560abcd228f5f86a352fe2451c0c17aaab73))


### Reverts

* **deps:** go back to TypeScript 6 and drop the experimental Next flag ([e0be0cb](https://github.com/fbuireu/forever-pto/commit/e0be0cb0782e461a291a6dda935684d19f2977ca))

## [1.6.3](https://github.com/fbuireu/forever-pto/compare/v1.6.2...v1.6.3) (2026-07-24)


### Bug Fixes

* **ci:** unblock prod deploy after dependabot next bump ([#336](https://github.com/fbuireu/forever-pto/issues/336)) ([f9d8a8f](https://github.com/fbuireu/forever-pto/commit/f9d8a8fc35c8337c28c9b4cb83c1288b75801ad3)), closes [#335](https://github.com/fbuireu/forever-pto/issues/335)

## [1.6.2](https://github.com/fbuireu/forever-pto/compare/v1.6.1...v1.6.2) (2026-07-12)


### Bug Fixes

* mobile tap support for tooltips and unblock content under the cookie banner ([#333](https://github.com/fbuireu/forever-pto/issues/333)) ([3864b22](https://github.com/fbuireu/forever-pto/commit/3864b22649e2f94cf3b44e8b539ea483f9d07ce1))

## [1.6.1](https://github.com/fbuireu/forever-pto/compare/v1.6.0...v1.6.1) (2026-07-12)


### Bug Fixes

* prevent hover flicker on elements that translate on hover ([#331](https://github.com/fbuireu/forever-pto/issues/331)) ([354aff2](https://github.com/fbuireu/forever-pto/commit/354aff2c288ad1c46bdc6fff01cc997c3f7f4eee))

# [1.6.0](https://github.com/fbuireu/forever-pto/compare/v1.5.0...v1.6.0) (2026-07-03)


### Features

* enable cache components ([#330](https://github.com/fbuireu/forever-pto/issues/330)) ([a22de2d](https://github.com/fbuireu/forever-pto/commit/a22de2d20b9d944fd0826d21d69d201d9cc44e9b))

# [1.5.0](https://github.com/fbuireu/forever-pto/compare/v1.4.7...v1.5.0) (2026-06-23)


### Bug Fixes

* **deps:** sync pnpm-lock.yaml with bumped package.json versions ([6da2d5a](https://github.com/fbuireu/forever-pto/commit/6da2d5a1fe0b1e8b3186ec736c40afe80eb0e09a))
* **deps:** sync stripe-js 9.8.0 in lockfile after [#322](https://github.com/fbuireu/forever-pto/issues/322) merge ([1351523](https://github.com/fbuireu/forever-pto/commit/13515239ef56bf439ab758bf708f5bbdefb3da9e))
* **deps:** update dependency @stripe/react-stripe-js to v6.6.0 ([#321](https://github.com/fbuireu/forever-pto/issues/321)) ([b8b964b](https://github.com/fbuireu/forever-pto/commit/b8b964bff8f65a38f30c5f6f78d882eee5231e59))
* **deps:** update dependency @stripe/stripe-js to v9.8.0 ([#322](https://github.com/fbuireu/forever-pto/issues/322)) ([8f7ea60](https://github.com/fbuireu/forever-pto/commit/8f7ea6001f810feb14275a07a3c872a5cc76f092))
* **deps:** update dependency react-hook-form to v7.78.0 ([#323](https://github.com/fbuireu/forever-pto/issues/323)) ([458251d](https://github.com/fbuireu/forever-pto/commit/458251d8652efe4a5d91f87948b6e4451715a2aa))
* **deps:** update dependency stripe to v22.2.1 ([#315](https://github.com/fbuireu/forever-pto/issues/315)) ([6d4e518](https://github.com/fbuireu/forever-pto/commit/6d4e518ececa29c5c799bd3a12d66c81bcac4f1b))
* **deps:** update lucide monorepo to v1.18.0 ([#324](https://github.com/fbuireu/forever-pto/issues/324)) ([7760ce5](https://github.com/fbuireu/forever-pto/commit/7760ce576e69b8f7bbd7badc0d43be4484833f11))
* **deps:** update nextjs monorepo to v16.2.9 ([#316](https://github.com/fbuireu/forever-pto/issues/316)) ([017a093](https://github.com/fbuireu/forever-pto/commit/017a093f1ee132a5752e8dfc3e8d14d9b1ce22c8))
* tests ([6729c1c](https://github.com/fbuireu/forever-pto/commit/6729c1c3c9b5b52b20f4147cfeb4f8a9c8a203ea))


### Features

* add after() ([6002065](https://github.com/fbuireu/forever-pto/commit/600206546678edf391d5c043c570a5595982815b))

## [1.4.7](https://github.com/fbuireu/forever-pto/compare/v1.4.6...v1.4.7) (2026-06-15)


### Bug Fixes

* **dates:** use temporal-polyfill so Temporal works in Cloudflare Workers ([09090d2](https://github.com/fbuireu/forever-pto/commit/09090d29bc9faaac0ba4450ce05076cdeb65e36c))
* **deps:** update dependency @tursodatabase/serverless to v1.2.2 ([#312](https://github.com/fbuireu/forever-pto/issues/312)) ([916211c](https://github.com/fbuireu/forever-pto/commit/916211ca98f4b055f6b113571e4e210297842427))

## [1.4.6](https://github.com/fbuireu/forever-pto/compare/v1.4.5...v1.4.6) (2026-06-15)


### Bug Fixes

* **deps:** update dependency effect to v3.21.3 ([#313](https://github.com/fbuireu/forever-pto/issues/313)) ([85eb3ae](https://github.com/fbuireu/forever-pto/commit/85eb3ae580045ba9a8ac2ede1c989114bdf0632e))

## [1.4.5](https://github.com/fbuireu/forever-pto/compare/v1.4.4...v1.4.5) (2026-06-03)


### Bug Fixes

* e2e ([bf59aeb](https://github.com/fbuireu/forever-pto/commit/bf59aeb2af65028c631b2b9ae4301d19bcf702c5))

## [1.4.4](https://github.com/fbuireu/forever-pto/compare/v1.4.3...v1.4.4) (2026-05-30)


### Bug Fixes

* cookie management ([bd316cf](https://github.com/fbuireu/forever-pto/commit/bd316cfba7c50072d7c191742e88e4492edd5728))
* fine-grain cookie selection ([e3fd38a](https://github.com/fbuireu/forever-pto/commit/e3fd38a261fbbe6f3a18a6de0b647daf12f1b94a))

## [1.4.3](https://github.com/fbuireu/forever-pto/compare/v1.4.2...v1.4.3) (2026-05-17)


### Bug Fixes

* permissions ci ([925d16d](https://github.com/fbuireu/forever-pto/commit/925d16ddacb119f3d47965e97518aea22f036a5d))
* slide parent tab ([9fce8f2](https://github.com/fbuireu/forever-pto/commit/9fce8f2eaa95f79f4af79753ceffbe45976081fb))

## [1.4.2](https://github.com/fbuireu/forever-pto/compare/v1.4.1...v1.4.2) (2026-05-17)


### Bug Fixes

* show current flag ([7a56eaf](https://github.com/fbuireu/forever-pto/commit/7a56eaf5787c454a51b6918ee79e70c9e504396f))

## [1.4.1](https://github.com/fbuireu/forever-pto/compare/v1.4.0...v1.4.1) (2026-05-17)


### Performance Improvements

* improve tree-shaking ([6b8bdae](https://github.com/fbuireu/forever-pto/commit/6b8bdae4aedd8b15bfa88c09f079125f2e5dc605))

# [1.4.0](https://github.com/fbuireu/forever-pto/compare/v1.3.8...v1.4.0) (2026-05-16)


### Bug Fixes

* ntfs ([8af1b7a](https://github.com/fbuireu/forever-pto/commit/8af1b7a4620c7c13c9d5b5e87aacda9ce4204a27))


### Features

* add flags ([864a97a](https://github.com/fbuireu/forever-pto/commit/864a97a8cc598300752392ea9a42add02c021e73))

## [1.3.8](https://github.com/fbuireu/forever-pto/compare/v1.3.7...v1.3.8) (2026-05-16)


### Bug Fixes

* test variant ([36f5646](https://github.com/fbuireu/forever-pto/commit/36f5646a549ae76a872b1687867eee648812ef01))

## [1.3.7](https://github.com/fbuireu/forever-pto/compare/v1.3.6...v1.3.7) (2026-05-16)


### Bug Fixes

* config raw ([05de15a](https://github.com/fbuireu/forever-pto/commit/05de15a487398eafcf47678aea3e1e1bc6170c65))

## [1.3.6](https://github.com/fbuireu/forever-pto/compare/v1.3.5...v1.3.6) (2026-05-15)


### Bug Fixes

* marquee speed ([825da4c](https://github.com/fbuireu/forever-pto/commit/825da4c2db008eaf0142d3a46c13d09174d4c841))

## [1.3.5](https://github.com/fbuireu/forever-pto/compare/v1.3.4...v1.3.5) (2026-05-15)


### Bug Fixes

* marquee wrapper ([6aa9c6e](https://github.com/fbuireu/forever-pto/commit/6aa9c6ee8ec9dd771fb4f62087e0136c2b3e4faa))

## [1.3.4](https://github.com/fbuireu/forever-pto/compare/v1.3.3...v1.3.4) (2026-05-15)


### Bug Fixes

* seo redirect ([d147561](https://github.com/fbuireu/forever-pto/commit/d147561fda34e08920702e05b213a64775c43e5e))

## [1.3.3](https://github.com/fbuireu/forever-pto/compare/v1.3.2...v1.3.3) (2026-05-14)


### Bug Fixes

* marquee speed ([bfc6ba5](https://github.com/fbuireu/forever-pto/commit/bfc6ba5745a85b8ad0feb4dac22ef9d86b358b40))

## [1.3.2](https://github.com/fbuireu/forever-pto/compare/v1.3.1...v1.3.2) (2026-05-14)


### Bug Fixes

* marquee speed ([efce5c7](https://github.com/fbuireu/forever-pto/commit/efce5c72ba98e858b3cc20181e3ecb9cc5138a9e))

## [1.3.1](https://github.com/fbuireu/forever-pto/compare/v1.3.0...v1.3.1) (2026-05-12)


### Bug Fixes

* bunch of amazing stuff ([b892278](https://github.com/fbuireu/forever-pto/commit/b8922788e03084f732c73e878b16facafc9a7386))

# [1.3.0](https://github.com/fbuireu/forever-pto/compare/v1.2.11...v1.3.0) (2026-05-12)


### Features

* react-doctor feedback ([#290](https://github.com/fbuireu/forever-pto/issues/290)) ([1f60341](https://github.com/fbuireu/forever-pto/commit/1f603419ded27e45012a4eaa1721e36792183fc5))

## [1.2.11](https://github.com/fbuireu/forever-pto/compare/v1.2.10...v1.2.11) (2026-05-11)


### Bug Fixes

* minor style fixes ([fb50e6a](https://github.com/fbuireu/forever-pto/commit/fb50e6a379b0f2b642eb3e16befdff3fb8aee000))

## [1.2.10](https://github.com/fbuireu/forever-pto/compare/v1.2.9...v1.2.10) (2026-05-11)


### Bug Fixes

* remove pointer-events ([3a93c2b](https://github.com/fbuireu/forever-pto/commit/3a93c2bc7be7100a7fa62061406e151558eaff21))

## [1.2.9](https://github.com/fbuireu/forever-pto/compare/v1.2.8...v1.2.9) (2026-05-11)


### Bug Fixes

* modal false ([b62cb4f](https://github.com/fbuireu/forever-pto/commit/b62cb4fa567bdc65b3243a7e2eced666e2efd13a))

## [1.2.8](https://github.com/fbuireu/forever-pto/compare/v1.2.7...v1.2.8) (2026-05-11)


### Bug Fixes

* wrap cookie lazyload provider ([2afb345](https://github.com/fbuireu/forever-pto/commit/2afb345ea2a46f0e75e117ba762fc7d9710e33df))

## [1.2.7](https://github.com/fbuireu/forever-pto/compare/v1.2.6...v1.2.7) (2026-05-11)


### Bug Fixes

* replace sheet ([52f29fd](https://github.com/fbuireu/forever-pto/commit/52f29fd0d00ae3a3a7f0ff899542ccefa4b715b2))
* replace sheet ([7289009](https://github.com/fbuireu/forever-pto/commit/7289009d07f030de980138e37fbe0883b8ad11ce))

## [1.2.6](https://github.com/fbuireu/forever-pto/compare/v1.2.5...v1.2.6) (2026-05-11)


### Bug Fixes

* race condition open pin ([d25b314](https://github.com/fbuireu/forever-pto/commit/d25b314c03fda68e97ee63a158852706c9c4b1fc))
* race condition open pin ([8c1ef29](https://github.com/fbuireu/forever-pto/commit/8c1ef296bb649936c9dafa337bbba41a73fc8e45))
* race condition open pin ([a9fa72a](https://github.com/fbuireu/forever-pto/commit/a9fa72a8fc0bbcb8178cbfa742b6f8bc8aafc37d))

## [1.2.5](https://github.com/fbuireu/forever-pto/compare/v1.2.4...v1.2.5) (2026-05-11)


### Bug Fixes

* root pin api ([a02fd2e](https://github.com/fbuireu/forever-pto/commit/a02fd2e1b62efbc4efe9b12c2361dc833c1d945a))

## [1.2.4](https://github.com/fbuireu/forever-pto/compare/v1.2.3...v1.2.4) (2026-05-10)


### Bug Fixes

* freeze sidebar ([aff1c5b](https://github.com/fbuireu/forever-pto/commit/aff1c5b37970af3c43922e66d04dfd5a17e07bda))

## [1.2.3](https://github.com/fbuireu/forever-pto/compare/v1.2.2...v1.2.3) (2026-05-10)


### Bug Fixes

* freeze sidebar ([42acb05](https://github.com/fbuireu/forever-pto/commit/42acb0525098366beec219410aa7336e144a4609))

## [1.2.2](https://github.com/fbuireu/forever-pto/compare/v1.2.1...v1.2.2) (2026-05-10)


### Bug Fixes

* overflow faqs ([407f14c](https://github.com/fbuireu/forever-pto/commit/407f14c1d482b61ae12a96013a1f86f6254d9f25))

## [1.2.1](https://github.com/fbuireu/forever-pto/compare/v1.2.0...v1.2.1) (2026-05-10)


### Bug Fixes

* revert ([b9370f3](https://github.com/fbuireu/forever-pto/commit/b9370f3e45178ea537effcdb52ed9bf2382e1a34))


### Reverts

* Revert "feat: restore animate" ([1fbbdbe](https://github.com/fbuireu/forever-pto/commit/1fbbdbe1986e02adc3868f96e117081d4e9fa3e5))

# [1.2.0](https://github.com/fbuireu/forever-pto/compare/v1.1.6...v1.2.0) (2026-05-10)


### Features

* restore animate ([5d1d451](https://github.com/fbuireu/forever-pto/commit/5d1d45164cde738dc3d68654fb0fa496ac9173b4))

## [1.1.6](https://github.com/fbuireu/forever-pto/compare/v1.1.5...v1.1.6) (2026-05-10)


### Bug Fixes

* span animate propagation ([49cb914](https://github.com/fbuireu/forever-pto/commit/49cb914200e657f519bd2c08018b541b9cc0760f))

## [1.1.5](https://github.com/fbuireu/forever-pto/compare/v1.1.4...v1.1.5) (2026-05-10)


### Bug Fixes

* resize logo ([b648315](https://github.com/fbuireu/forever-pto/commit/b6483151f69b8a0f2a790832f22302f24532eff8))

## [1.1.4](https://github.com/fbuireu/forever-pto/compare/v1.1.3...v1.1.4) (2026-05-10)


### Bug Fixes

* freeze portal ([131ad7b](https://github.com/fbuireu/forever-pto/commit/131ad7b6558b16cc641f35bcd37c167979c33c0b))
* freeze portal ([d6e96d0](https://github.com/fbuireu/forever-pto/commit/d6e96d09e5589fde414db942bfe51c70ab49db22))

## [1.1.3](https://github.com/fbuireu/forever-pto/compare/v1.1.2...v1.1.3) (2026-05-10)


### Bug Fixes

* frozen animate asChild ([e5cc6bf](https://github.com/fbuireu/forever-pto/commit/e5cc6bff6a1eb62bacb3509274198a4240a4f268))
* frozen animate asChild ([8ef6130](https://github.com/fbuireu/forever-pto/commit/8ef6130349318905a522d52e11e063468ff4f724))
* frozen animate asChild ([2431a13](https://github.com/fbuireu/forever-pto/commit/2431a13d8b7c2fbb2739f0f3edd24912df300fd2))

## [1.1.2](https://github.com/fbuireu/forever-pto/compare/v1.1.1...v1.1.2) (2026-05-10)


### Bug Fixes

* freeze ([7028df0](https://github.com/fbuireu/forever-pto/commit/7028df0f5c80c8627f803741ab665aa605da6347))
* freeze ([5cadbe6](https://github.com/fbuireu/forever-pto/commit/5cadbe66e87692c865a8353aaf19ec732fe64685))
* freeze ([6cee03b](https://github.com/fbuireu/forever-pto/commit/6cee03b6e985e78e72f088cd72dfb1e9fae24fb9))

## [1.1.1](https://github.com/fbuireu/forever-pto/compare/v1.1.0...v1.1.1) (2026-05-10)


### Bug Fixes

* add Toaster to marketing layout and simplify payment error message ([1ad8c8b](https://github.com/fbuireu/forever-pto/commit/1ad8c8b6be7538ebd42e2e66d5678f2c4638eafe))
* remove invalid opt ([257f0f5](https://github.com/fbuireu/forever-pto/commit/257f0f558b353dd137e10f07075e3ba1cbcb845e))

# [1.1.0](https://github.com/fbuireu/forever-pto/compare/v1.0.6...v1.1.0) (2026-05-10)


### Features

* add v1 neobrutalism ([#278](https://github.com/fbuireu/forever-pto/issues/278)) ([02caa8e](https://github.com/fbuireu/forever-pto/commit/02caa8e712e258aa0df8c18b81bb58b634d5c403))

## [1.0.6](https://github.com/fbuireu/forever-pto/compare/v1.0.5...v1.0.6) (2026-04-18)


### Bug Fixes

* pto days count ([03680dc](https://github.com/fbuireu/forever-pto/commit/03680dcfff384ea6b826d6d5b9b3c292748c00a6))

## [1.0.5](https://github.com/fbuireu/forever-pto/compare/v1.0.4...v1.0.5) (2026-04-18)


### Bug Fixes

* pto days count ([007ef7f](https://github.com/fbuireu/forever-pto/commit/007ef7ffd336109a4e393e493373329c54774933))

## [1.0.4](https://github.com/fbuireu/forever-pto/compare/v1.0.3...v1.0.4) (2026-04-18)


### Bug Fixes

* pto days count ([a2e046b](https://github.com/fbuireu/forever-pto/commit/a2e046bf096f9f38a4462f644a1119e3459cbf97))

## [1.0.3](https://github.com/fbuireu/forever-pto/compare/v1.0.2...v1.0.3) (2026-04-18)


### Bug Fixes

* minor styling ([b7464e8](https://github.com/fbuireu/forever-pto/commit/b7464e81f09e6389f6ae27b88a4e5fdc19b35213))

## [1.0.2](https://github.com/fbuireu/forever-pto/compare/v1.0.1...v1.0.2) (2026-04-17)


### Bug Fixes

* ci vars ([8e2b4dd](https://github.com/fbuireu/forever-pto/commit/8e2b4dd54d968ad5b746c3e35e2cc2b4c44b785b))

## [1.0.1](https://github.com/fbuireu/forever-pto/compare/v1.0.0...v1.0.1) (2026-04-17)


### Bug Fixes

* ci sample log ([c5fe2e4](https://github.com/fbuireu/forever-pto/commit/c5fe2e4cb5392c7b12517cc7a81e6b099128d0b4))
