import express from 'express'
import {createServer} from 'http'
import {Server} from 'socket.io'
import {YSocketIO} from 'y-socket.io/dist/server'


const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 3000;

const io = new Server(httpServer,{
   cors:{
      origin:'*',
      method:['GET','POST']
   }
})

const ySocketIO = new YSocketIO(io);
ySocketIO.initialize();


app.get('/',(req,res)=>{
   res.status(200).json({msg: 'working properly',success:'true'});
})

app.get('/health',(req,res)=>{
   res.status(200).json({
      message:"hello world",
      success:true,
   })
})
httpServer.listen(PORT,()=>{
   console.log(`server running on port ${PORT}`);
})