export default [
  { path: "/", page: "home" },
  {
    path: "/resourcepacks",
    page: "listing",
    type: "resourcepacks",
    meta: {
      title: "Resource Packs - Ewan Howell",
      description: "View all of Ewan Howell's Minecraft resource packs",
      image: "resourcepacks/f8thful/images/farm.webp",
      colour: "#449518"
    }
  },
  { path: "/resourcepacks/:name([^/.]+)", page: "entry", type: "resourcepacks" },
  {
    path: "/maps",
    page: "listing",
    type: "maps",
    meta: {
      title: "Maps - Ewan Howell",
      description: "View all of Ewan Howell's Minecraft maps",
      image: "maps/entity-tester/images/entities.webp",
      colour: "#54422B"
    }
  },
  { path: "/maps/:name([^/.]+)", page: "entry", type: "maps" },
  {
    path: "/plugins",
    page: "plugins",
    meta: {
      title: "Plugins - Ewan Howell",
      description: "View all of Ewan Howell's Blockbench plugins",
      image: "plugins/cem-template-loader/images/dialog.webp",
      colour: "#21252A"
    }
  },
  { path: "/plugins/:name([^/.]+)", page: "plugin" },
  {
    path: "/themes",
    page: "listing",
    type: "themes",
    meta: {
      title: "Themes - Ewan Howell",
      description: "View all of Ewan Howell's Blockbench themes",
      image: "themes/blockbenchcord/images/menu.webp",
      colour: "#3E90FF"
    }
  },
  { path: "/themes/:name([^/.]+)", page: "entry", type: "themes" },
  {
    path: "/dungeonsmods",
    page: "listing",
    type: "dungeonsmods",
    meta: {
      title: "Dungeons Mods - Ewan Howell",
      description: "View all of Ewan Howell's dungeons mods",
      image: "dungeonsmods/f8thful-dungeons/images/zombie.webp",
      colour: "#4C631D"
    }
  },
  { path: "/dungeonsmods/:name([^/.]+)", page: "entry", type: "dungeonsmods" },
  {
    path: "/dungeons2mods",
    page: "listing",
    type: "dungeons2mods",
    meta: {
      title: "Dungeons II Mods - Ewan Howell",
      description: "View all of Ewan Howell's Minecraft Dungeons II mods",
      image: "dungeons2mods/custom-skin-loader/images/skin_loader_1.webp",
      colour: "#FAAD2A"
    }
  },
  { path: "/dungeons2mods/:name([^/.]+)", page: "entry", type: "dungeons2mods" },
  {
    path: "/renders",
    page: "renders",
    meta: {
      title: "Renders - Ewan Howell",
      description: "View all of Ewan Howell's Blender renders",
      image: "renders/4k/glados.webp",
      colour: "#222033"
    }
  },
  {
    path: "/npm",
    page: "npm",
    meta: {
      title: "NPM Modules - Ewan Howell",
      description: "NPM modules published by Ewan Howell"
    }
  },
  {
    path: "/tools",
    page: "tools",
    meta: {
      title: "Tools - Ewan Howell",
      description: "Tools to help you create resource packs"
    }
  },
  {
    path: "/tools/ctmconverter",
    page: "tools/ctmconverter",
    meta: {
      title: "CTM Converter - Ewan Howell",
      description: "Convert compact CTM to full or overlay CTM",
      image: "minecraft/ctm.webp",
      colour: "#9C4817"
    }
  },
  {
    path: "/tools/mojangconverter",
    page: "tools/mojangconverter",
    meta: {
      title: "Mojang Converter - Ewan Howell",
      description: "Convert the Mojang Studios logo texture between the 1.15 and 1.16 formats",
      image: "minecraft/mojangstudios.webp",
      colour: "#E12837"
    }
  },
  {
    path: "/tools/minecrafttitleconverter",
    page: "tools/minecrafttitleconverter",
    meta: {
      title: "Minecraft Title Converter - Ewan Howell",
      description: "Convert any image into the Minecraft title texture format so you can use it in a resource pack",
      image: "minecraft/minecrafttitle.webp",
      colour: "#3B8426"
    }
  },
  {
    path: "/tools/chestconverter",
    page: "tools/chestconverter",
    meta: {
      title: "Chest Converter - Ewan Howell",
      description: "Convert the chest textures between the 1.14 and 1.15 formats",
      image: "minecraft/chests.webp",
      colour: "#A16B23"
    }
  },
  {
    path: "/tools/bedconverter",
    page: "tools/bedconverter",
    meta: {
      title: "Bed Converter - Ewan Howell",
      description: "Convert Minecraft bed entity textures to the 26.2 block format",
      image: "minecraft/beds.webp",
      colour: "#AE3535"
    }
  },
  {
    path: "/tools/mobblockvariants",
    page: "tools/mobblockvariants",
    meta: {
      title: "Mob Block Variants - Ewan Howell",
      description: "Make a mob always show a chosen block variant while keeping it extremely rare on placed blocks",
      image: "minecraft/mobblockvariants.webp",
      colour: "#4A6274"
    }
  },
  {
    path: "/tools/placedblockvariants",
    page: "tools/placedblockvariants",
    meta: {
      title: "Placed Block Variants - Ewan Howell",
      description: "Force specific placed blocks at chosen coordinates to render chosen variants, from a single block",
      image: "minecraft/placedblockvariants.webp",
      colour: "#8E9F80"
    }
  },
  {
    path: "/tools/dungeons2skinconverter",
    page: "tools/dungeons2skinconverter",
    meta: {
      title: "Custom Skin Converter for Minecraft Dungeons II - Ewan Howell",
      description: "Convert Minecraft Java skins and capes to the Minecraft Dungeons II layout for the Custom Skin Loader mod",
      image: "dungeons2/skinconverter.webp",
      colour: "#12A86C"
    }
  },
  {
    path: "/tools/colormapgenerator",
    page: "tools/colormapgenerator",
    meta: {
      title: "Biome Colormap Generator - Ewan Howell",
      description: "Generate Minecraft biome colormaps for any version, including OptiFine grid colormaps, biome ID lists, and vanilla colormap biome maps",
      image: "minecraft/biomecolormaps.webp",
      colour: "#91BD59"
    }
  },
  {
    path: "/minecraft-title-generator",
    page: "minecraft-title-generator",
    meta: {
      title: "Minecraft Title Generator - Ewan Howell",
      description: "Generate Minecraft-styled title logos with custom text and textures",
      image: "plugins/minecraft-title-generator/images/logo.webp",
      colour: "#3B8426"
    }
  },
  {
    path: "/guides",
    page: "guides",
    meta: {
      title: "Guides - Ewan Howell",
      description: "Guides to help you create resource packs",
      icon: "guides/icon.webp"
    }
  },
  { path: "/guides/:name([^/.]+)", page: "guide" }
]
