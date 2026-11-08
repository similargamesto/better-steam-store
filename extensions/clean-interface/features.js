const BSCI_FEATURES = [
  {
    id: "queuebar",
    group: "Top of the page",
    name: "Hide wishlist and queue bar",
    description: "The bar under the screenshots: Add to your wishlist, Follow, Ignore, share and Next in Queue.",
    default: false,
    hide: [".queue_overflow_ctn"]
  },
  {
    id: "earlyaccess",
    group: "Top of the page",
    name: "Hide Early Access notice",
    description: "The \"Early Access Game\" box and what the developers say about it.",
    default: false,
    hide: ["#earlyAccessHeader"]
  },
  {
    id: "franchise",
    group: "Top of the page",
    name: "Hide franchise banner",
    description: "The \"Check out the entire ... collection on Steam\" banner above the purchase section.",
    default: false,
    hide: [".franchise_notice"]
  },
  {
    id: "buybox",
    group: "Purchase",
    name: "Hide buy and play boxes",
    description: "The game's own Buy / Play boxes, editions included. Bundles have their own option.",
    default: false,
    hide: [
      "#game_area_purchase > .game_area_purchase_game",
      "#game_area_purchase .game_area_purchase_game_wrapper:not([data-ds-bundleid]):not(.dynamic_bundle_description)"
    ]
  },
  {
    id: "bundles",
    group: "Purchase",
    name: "Hide bundles",
    description: "Bundle offers in the purchase section. Editions of the game stay.",
    default: false,
    hide: [
      ".game_area_purchase_game_wrapper[data-ds-bundleid]",
      ".game_area_purchase_game_wrapper.dynamic_bundle_description",
      "a[href*=\"store.steampowered.com/bundlelist/\"]"
    ]
  },
  {
    id: "dlc",
    group: "Purchase",
    name: "Hide \"Content For This Game\"",
    description: "The DLC list under the purchase section.",
    default: false,
    hide: ["#gameAreaDLCSection"]
  },
  {
    id: "news",
    group: "Description",
    name: "Hide \"Recent Events & Announcements\"",
    description: "The news and events row under the purchase section.",
    default: false,
    hide: ["[data-featuretarget=\"events-row\"]"]
  },
  {
    id: "feedback",
    group: "Description",
    name: "Hide feedback banner",
    description: "The \"Report bugs and leave feedback\" box on Early Access games.",
    default: false,
    hide: [".early_access_banner"]
  },
  {
    id: "press",
    group: "Description",
    name: "Hide press reviews",
    description: "The \"Reviews\" quotes above the description.",
    default: false,
    hide: ["#game_area_reviews"]
  },
  {
    id: "updates",
    group: "Description",
    name: "Hide \"Just Updated\"",
    description: "The latest patch notes above the description.",
    default: false,
    hide: [
      ".game_page_autocollapse_ctn:has(> .game_page_autocollapse > .game_area_description:not([id]))",
      ".game_page_autocollapse:has(> .game_area_description:not([id]))"
    ]
  },
  {
    id: "about",
    group: "Description",
    name: "Hide \"About This Game\"",
    description: "The game's long description.",
    default: false,
    hide: ["#game_area_description"]
  },
  {
    id: "mature",
    group: "Description",
    name: "Hide mature content description",
    description: "The developer's note about mature content.",
    default: false,
    hide: [
      ".game_page_autocollapse_ctn:has(#game_area_content_descriptors)",
      ".game_page_autocollapse:has(> #game_area_content_descriptors)",
      "#game_area_content_descriptors"
    ]
  },
  {
    id: "sysreq",
    group: "Description",
    name: "Hide system requirements",
    description: "The minimum and recommended specs.",
    default: false,
    hide: [".game_page_autocollapse_ctn:has(> .sys_req)"]
  },
  {
    id: "legal",
    group: "Description",
    name: "Hide legal notice",
    description: "The trademark and copyright lines under the system requirements.",
    default: false,
    hide: [
      ".game_page_autocollapse_ctn:has(#game_area_legal)",
      ".game_page_autocollapse:has(> #game_area_legal)",
      "#game_area_legal"
    ]
  },
  {
    id: "relevance",
    group: "Side column",
    name: "Hide \"Is this game relevant to you?\"",
    description: "Friends, similar games you played and review summary at the top of the side column.",
    default: false,
    hide: [".rightcol.game_meta_data > .block:has(~ #category_block)"]
  },
  {
    id: "features",
    group: "Side column",
    name: "Hide features list",
    description: "Single-player, Family Sharing, controller support and similar.",
    default: false,
    hide: ["#category_block"]
  },
  {
    id: "languages",
    group: "Side column",
    name: "Hide languages",
    description: "The supported languages table.",
    default: false,
    hide: [".block.responsive_apppage_details_right:has(#languageTable)"]
  },
  {
    id: "rating",
    group: "Side column",
    name: "Hide age rating",
    description: "The PEGI, ESRB or other age rating box.",
    default: false,
    hide: ["[data-featuretarget=\"game-rating-block\"]"]
  },
  {
    id: "achievements",
    group: "Side column",
    name: "Hide achievements",
    description: "The Steam Achievements preview.",
    default: false,
    hide: ["[data-featuretarget=\"achievements\"]"]
  },
  {
    id: "pointsshop",
    group: "Side column",
    name: "Hide Points Shop items",
    description: "Points Shop rewards for this game in the side column.",
    default: false,
    hide: [".block.responsive_apppage_details_right:has(.communitylink_points_shop_images)", "#bannerPointsShop"]
  },
  {
    id: "details",
    group: "Side column",
    name: "Hide game details and links",
    description: "Title, genre, developer, publisher, release date and the links under them.",
    default: false,
    hide: ["#appDetailsUnderlinedLinks"]
  },
  {
    id: "embed",
    group: "Side column",
    name: "Hide Embed button",
    description: "The Embed and report buttons in the side column.",
    default: false,
    hide: ["#shareEmbedRow"]
  },
  {
    id: "metacritic",
    group: "Side column",
    name: "Hide Metacritic score",
    description: "The Metacritic box in the side column.",
    default: false,
    hide: ["#apppage_metacritic_block"]
  },
  {
    id: "awards",
    group: "Side column",
    name: "Hide awards",
    description: "The Awards box in the side column.",
    default: false,
    hide: ["#awardsTable", "#bannerAwards"]
  },
  {
    id: "events",
    group: "Recommendations",
    name: "Hide sale events",
    description: "The \"part of an event\" box.",
    default: true,
    hide: ["[data-featuretarget=\"store-sale-crosspromo\"]"]
  },
  {
    id: "morefrom",
    group: "Recommendations",
    name: "Hide \"More from\"",
    description: "Other games from the developer or publisher.",
    default: false,
    hide: ["[data-featuretarget=\"creatorhome-carousel\"]"]
  },
  {
    id: "compactmorefrom",
    group: "Recommendations",
    name: "Compact \"More from\"",
    description: "Smaller cards, six in a row, for the developer and publisher row.",
    default: true,
    carousel: { target: "[data-featuretarget=\"creatorhome-carousel\"]", perRow: 6 }
  },
  {
    id: "morelike",
    group: "Recommendations",
    name: "Hide \"More like this\"",
    description: "Steam's similar games row.",
    default: false,
    hide: ["[data-featuretarget][data-props*=\"more_like_this_carousel\"]"]
  },
  {
    id: "compactmorelike",
    group: "Recommendations",
    name: "Compact \"More like this\"",
    description: "Smaller cards, six in a row, so the row takes less space.",
    default: true,
    carousel: { target: "[data-featuretarget][data-props*=\"more_like_this_carousel\"]", perRow: 6 }
  },
  {
    id: "alsoplay",
    group: "Recommendations",
    name: "Hide \"Players also play\"",
    description: "The row added by Better Steam Also Play.",
    default: false,
    hide: ["[data-bsa]"]
  },
  {
    id: "compactalsoplay",
    group: "Recommendations",
    name: "Compact \"Players also play\"",
    description: "Smaller cards, six in a row, for the row added by Better Steam Also Play.",
    default: true,
    carousel: { target: "[data-bsa]", perRow: 6 }
  },
  {
    id: "curators",
    group: "Recommendations",
    name: "Hide \"What Curators Say\"",
    description: "The curator reviews section.",
    default: true,
    hide: [".steam_curators_block"]
  },
  {
    id: "reviewsummary",
    group: "Reviews",
    name: "Hide review summary",
    description: "The \"Customer reviews\" heading and the overall score above the reviews.",
    default: true,
    hide: ["[data-featuretarget=\"appreviews\"] > div > div:nth-child(-n+2):not(:last-child)"],
    style: [["[data-featuretarget=\"appreviews\"] > div", "padding-top: 40px !important;"]]
  },
  {
    id: "reviewfilters",
    group: "Reviews",
    name: "Hide review filters",
    description: "Review Type, Language and the other filters, and the \"Showing ... reviews\" line. Reviews stay.",
    default: false,
    hide: ["[data-featuretarget=\"appreviews\"] > div > div:nth-child(n+3):not(:last-child)"]
  },
  {
    id: "compactreviews",
    group: "Reviews",
    name: "Compact reviews",
    description: "Reviews without vote buttons, awards and PC specs. \"Read More\" moves under the line.",
    default: true,
    target: "[data-featuretarget=\"appreviews\"] > div > div:last-child",
    style: [
      ["[data-featuretarget=\"appreviews\"] div:has(> hr) > div:not(:first-child):has(~ hr):not(:has(> div > div))", "display: none !important;"],
      ["[data-featuretarget=\"appreviews\"] div:has(> hr) > hr ~ div:has(button)", "display: none !important;"],
      ["[data-featuretarget=\"appreviews\"] div:has(> hr) > hr ~ div:has(.tool-tip-source)", "display: none !important;"],
      ["[data-featuretarget=\"appreviews\"] div:has(> hr)", "display: grid !important; grid-template-columns: 1fr auto; column-gap: 12px; align-items: center;"],
      ["[data-featuretarget=\"appreviews\"] div:has(> hr) > *", "grid-column: 1 / -1;"],
      ["[data-featuretarget=\"appreviews\"] div:has(> hr) > div:has(> button)", "display: contents !important;"],
      ["[data-featuretarget=\"appreviews\"] div:has(> hr) > div:has(> button) > *", "grid-column: 1 / -1;"],
      ["[data-featuretarget=\"appreviews\"] div:has(> hr) > div:has(> button) > button", "grid-column: 2; order: 1; justify-self: end; margin: 6px 0 0 !important;"],
      ["[data-featuretarget=\"appreviews\"] div:has(> hr) > hr ~ div:not(:has(button)):not(:has(.tool-tip-source))", "grid-column: 1;"]
    ]
  },
  {
    id: "friendreviews",
    group: "Reviews",
    name: "Hide \"Reviews by Friends\"",
    description: "Your friends' reviews above the most helpful ones. Only shown when you're signed in.",
    default: false,
    hide: ["[data-featuretarget=\"appreviews\"] > div > div:last-child > div:first-child > div:not(:last-of-type)"]
  },
  {
    id: "helpfulreviews",
    group: "Reviews",
    name: "Hide \"Most Helpful Reviews\"",
    description: "The most helpful reviews list on the left.",
    default: false,
    hide: ["[data-featuretarget=\"appreviews\"] > div > div:last-child > div:first-child > div:last-of-type"]
  },
  {
    id: "recentreviews",
    group: "Reviews",
    name: "Hide \"Recently Posted\"",
    description: "The recent reviews column on the right.",
    default: false,
    hide: ["[data-featuretarget=\"appreviews\"] > div > div:last-child > div:last-child:not(:first-child)"]
  },
  {
    id: "browsereviews",
    group: "Reviews",
    name: "Hide \"Browse all reviews\" link",
    description: "The link under the reviews.",
    default: false,
    hide: ["[data-featuretarget=\"appreviews\"] > div > div:last-child > div > a"]
  }
];

const BSCI_CONTAINERS = [".related_items_ctn"];
