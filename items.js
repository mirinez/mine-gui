/*
  items.js - Minecraft GUI | Portfolio Project
  Master list of all inventory items.
*/

/*
  Each entry contains:
    id   - unique camelCase identifier used as data-item-id in the DOM
    name - display name shown in the tooltip on hover
    src  - path to the PNG sprite inside the /items folder
*/

/* ================================================================
   ITEMS ARRAY
*/

export const ITEMS = [
  { id: 'arrow',                    name: 'Arrow',                    src: 'items/Arrow.png'                    },
  { id: 'bamboo',                   name: 'Bamboo',                   src: 'items/Bamboo.png'                   },
  { id: 'blue_egg',                 name: 'Blue Egg',                 src: 'items/Blue_Egg.png'                 },
  { id: 'bush',                     name: 'Bush',                     src: 'items/Bush.png'                     },
  { id: 'emerald',                  name: 'Emerald',                  src: 'items/Emerald.png'                  },
  { id: 'eye_of_ender',             name: 'Eye of Ender',             src: 'items/Eye_of_Ender.png'             },
  { id: 'flow_banner_pattern',      name: 'Flow Banner Pattern',      src: 'items/Flow_Banner_Pattern.png'      },
  { id: 'iron_hoe',                 name: 'Iron Hoe',                 src: 'items/Iron_Hoe.png'                 },
  { id: 'locked_map',               name: 'Locked Map',               src: 'items/Locked_Map.png'               },
  { id: 'mangrove_propagule',       name: 'Mangrove Propagule',       src: 'items/Mangrove_Propagule.png'       },
  { id: 'milk_bucket',              name: 'Milk Bucket',              src: 'items/Milk_Bucket.png'              },
  { id: 'music_disc',               name: 'Music Disc',               src: 'items/Music_Disc.png'               },
  { id: 'name_tag',                 name: 'Name Tag',                 src: 'items/Name_Tag.png'                 },
  { id: 'painting',                 name: 'Painting',                 src: 'items/Painting.png'                 },
  { id: 'potion_of_oozing',         name: 'Potion of Oozing',         src: 'items/Potion_of_Oozing.png'         },
  { id: 'sea_pickle',               name: 'Sea Pickle',               src: 'items/Sea_Pickle.png'               },
  { id: 'seagrass',                 name: 'Seagrass',                 src: 'items/Seagrass.png'                 },
  { id: 'slime_spawn_egg',          name: 'Slime Spawn Egg',          src: 'items/Slime_Spawn_Egg.png'          },
  { id: 'sugar_cane',               name: 'Sugar Cane',               src: 'items/Sugar_Cane.png'               },
  { id: 'torchflower_seed',         name: 'Torchflower Seed',         src: 'items/Torchflower_Seed.png'         },
  { id: 'turtle_egg',               name: 'Turtle Egg',               src: 'items/Turtle_Egg.png'               },
  { id: 'weathered_copper_lantern', name: 'Weathered Copper Lantern', src: 'items/Weathered_Copper_Lantern.png' },
  { id: 'white_candle',             name: 'White Candle',             src: 'items/White_Candle.png'             },
  { id: 'world',                    name: 'World',                    src: 'items/World.gif'                    },
];