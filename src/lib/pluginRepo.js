export const repo = "https://raw.githubusercontent.com/JannisX11/blockbench-plugins/master"

export const slug = id => id.replaceAll("_", "-")
export const iconIsFile = icon => /\.(png|svg|webp|jpe?g)$/.test(icon)
export const isMine = plugin => /Ewan Howell/.test(plugin.author)
