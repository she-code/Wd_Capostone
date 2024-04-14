module.exports = {
  apps: [
    {
      script: "index.js",
      watch: "true",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
      instances: "max",
      exec_mode: "cluster",
      error_file: "D:\\wd\\Wd_Capostone\\logs\\error.log",
      out_file: "D:\\wd\\Wd_Capostone\\logs\\out.log",
    },
  ],
  deploy: {
    production: {
      // key: "D:/wd/Wd_Capostone/gitKey.pub",
      key: "C:/Users/fre/.ssh/id_rsa.pub",
      user: "fre",
      host: ["192.168.21.1"],
      ssh_options: "StrictHostKeyChecking=no",
      ref: "origin/main",
      repo: "git@github.com:she-code/Wd_Capostone.git",
      path: "D:/wd/Wd_Capostone",

      "pre-setup": "git --version",
      // "post-setup": "git --version",
      "post-setup": "npm install",
      "post-deploy": "pm2 startOrRestart ecosystem.config.js --env production",
      // "pre-deploy-local": "echo 'This is a local executed command'",
      // "post-deploy": "npm install",
    },
  },
};
