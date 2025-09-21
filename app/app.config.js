export default {
  name: "oildrop",
  slug: "oildrop",
  scheme: "oildrop",
  version: "0.1.0",
  orientation: "portrait",
  platforms: ["ios", "android", "web"],
  assetBundlePatterns: ["**/*"],
  web: {
    bundler: "metro",
    output: "static"
  },
  experiments: {
    typedRoutes: true
  }
};
