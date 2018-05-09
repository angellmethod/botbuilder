const botbuilder = require('botbuilder');
const restify = require('restify');

const server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`${server.name} now listening to ${server.url} `);
});

const adapter = new botbuilder.BotFrameworkAdapter({
    appId : process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

const userState = new botbuilder.UserState(new botbuilder.MemoryStorage());
//use doesn't seem documented
adapter.use(userState);

server.post('/api/messages', (req,res) => {
    adapter.processActivity (req,res, async (context) => {
            const user = userState.get(context);
            
            //Add a count variable to the user state that persists for the connection
            if(!user.count) user.count = 1;

            if(context.activity.type === 'message'){
                await context.sendActivity(`Hello there, current message count is ${user.count}.`);
                user.count++;
            }
    })
});