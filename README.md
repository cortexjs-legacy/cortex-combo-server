# Cortex Combo Server

### Feature

1. combo static files by file path, /<combo_root>/a.css,b.css,dir~c.css will concat `/a.css` `/b.css` `/dir/c.css` together
2. dynamic change relative background image path to absolute path
3. cache file with md5(request.path)

### Config
  
- `root`: the root dir to find origin file
- `combine_dir`: the combine cache dir

### Deployment

1. clone this project `git clone https://github.com/cortexjs/cortex-combo-server.git`
2. copy `server.js` to some other path to avoid pull conflict `cd cortex-combo-server && cp server.js _server.js`
3. edit `_server.js` config `root` and `combine_dir`, feel free to change `port`
4. install pm2 `npm install pm2 -g`
5. prepare start script  `echo 'pm2 start _server.js -i max --name "cortex-combo-server"' > start.sh && chmod +x start.sh`
5. prepare restart script  `echo 'npm install && pm2 restart "cortex-combo-server"' > restart.sh && chmod +x restart.sh`
6. start server `./start.sh`
7. config nginx
```
    location /combine {
        proxy_pass http://127.0.0.1:<port>;
    }