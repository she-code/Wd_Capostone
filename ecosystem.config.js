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
      key: "C:\\Users\\fre\\sshKey.ssh",
      user: "fre",
      host: ["192.168.21.1"],
      ssh_options: "StrictHostKeyChecking=no",
      ref: "origin/main",
      repo: "git@github.com:she-code/Wd_Capostone.git",
      path: "C:\\Users\\fre\\deployed",
      "pre-setup":
        "powershell -Command \"& {Start-Process msiexec -ArgumentList '/i https://github.com/git-for-windows/git/releases/download/v2.35.1.windows.1/Git-2.35.1-64-bit.exe /quiet /norestart' -Wait}\" ; dir",
      "post-setup": "dir",
      "pre-deploy-local": "echo 'This is a local executed command'",
      "post-deploy": "npm install",
    },
  },
};
