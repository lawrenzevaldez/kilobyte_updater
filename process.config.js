module.exports = {
    apps : [{
        name: "kilobyte_updater",
        script: "./server.js",
        watch: ["start", "config", "app", "resources"],
        ignore_watch : ["node_modules", "tmp", "public", "server.js"],
        env: {
        NODE_ENV: "development",
        },
        env_production: {
        NODE_ENV: "production",
        }
    }]
}