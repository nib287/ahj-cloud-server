const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body');
const app = new Koa();
const path = require('path');
const fs = require('fs');
const uuid = require('uuid')

app.use(koaBody({
    text: true,
    urlencoded: true,
    multipart: true,
    json: true
}));

const WS = require('ws');
const port = process.env.PORT || 8080;
const server = http.createServer(app.callback());
const wsServer = new WS.Server({server});

function getDate() {
    const options = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        timezone: 'UTC',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
    };
    
    return  new Date().toLocaleString("ru", options);
}

const instances = []

wsServer.on('connection', (ws, req) => {
    app.use(async(ctx, next) => {
        const origin = ctx.request.get('Origin');
        if(!origin) {
            return await next();
        }
        
        const headers = {'Access-Control-Allow-Origin': '*'}
        
        if(ctx.request.method !== 'OPTIONS') {
            ctx.response.set({...headers});
            try {
                return await next();
            }catch(e) {
                e.headers = {...e.headers,...headers};
                throw e;
            }
        }
        
        if(ctx.request.get('Access-Control-Request-Method')) {
            ctx.response.set({...headers,'Access-Control-Allow-Methods':'GET, POST, PUT, DELETE, PATCH'
        });
            
        if(ctx.request.get('Access-Control-Request-Headers')) {
            ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Allow-Request-Headers'));
        }
            
        ctx.response.status = 204;
        }
    });    
    
    ws.on('message', (evt) => {
        const data = JSON.parse(evt)
        const {type} = data
        
        switch(type) {
            case 'instances':
                const id = uuid.v4();
                ws.send(JSON.stringify({
                    id,
                    date: getDate(),
                    info: 'Received "Create command"',
                    type: 'received',            
                }));
                
                setTimeout(() => {
                    instances.push({
                        id,
                        state: 'stopped',
                    });

                    ws.send(JSON.stringify({
                        id,
                        date: getDate(),
                        info: 'Created',
                        type: 'created',
                    }));
                }, 3000);  
                
                break;

            case 'delete':
                ws.send(JSON.stringify({
                    id: data.id,
                    date: getDate(),
                    info: 'Received "Delete command"',
                    type: 'received',            
                }));
                
                setTimeout(() => {
                    const findInstanceIndex = instances.findIndex(instance => instance.id == data.id);
                    if(findInstanceIndex != -1) {
                        instances.splice(findInstanceIndex, 1);
                        ws.send(JSON.stringify({
                            id: data.id,
                            date: getDate(),
                            info: 'Deleted',
                            type: 'deleted',            
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            id: data.id,
                            date: getDate(),
                            info: 'Error: instance not found',
                            type: 'error',            
                        }));
                    }
                }, 3000);  
                
                break
            
            case 'start':
                ws.send(JSON.stringify({
                    id: data.id,
                    date: getDate(),
                    info: 'Received "Start command"',
                    type: 'received',            
                }));
                
                setTimeout(() => {
                    const findInstance = instances.find(instance => instance.id == data.id);
                    if(findInstance) {
                        ws.send(JSON.stringify({
                            id: data.id,
                            date: getDate(),
                            info: 'Started',
                            type: 'started',            
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            id: data.id,
                            date: getDate(),
                            info: 'Error: instance not found',
                            type: 'error',            
                        }));
                    }
                }, 3000);
                
                break
            
            case 'stop':
                ws.send(JSON.stringify({
                    id: data.id,
                    date: getDate(),
                    info: 'Received "Stop command"',
                    type: 'received',            
                }));
                
                setTimeout(() => {
                    const findInstance = instances.find(instance => instance.id == data.id);
                    if(findInstance) {
                        ws.send(JSON.stringify({
                            id: data.id,
                            date: getDate(),
                            info: 'Stopped',
                            type: 'stopped',            
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            id: data.id,
                            date: getDate(),
                            info: 'Error: instance not found',
                            type: 'error',            
                        }));
                    }
                }, 3000);
                
                break
        }
        
    });
});


server.listen(port);















