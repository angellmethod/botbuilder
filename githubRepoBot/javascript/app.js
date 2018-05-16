const botbuilder = require('botbuilder');
const restify = require('restify');
const http = require('https');
/*Create function to get github repos*/

const rp = require('request-promise');

const options = {
    //set URI with function
    //default URI
    uri: 'https://api.github.com/users/there/repos',
    headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response
};

const server = restify.createServer();

server.listen(process.env.port | process.env.PORT | 3978, () => {
    console.log(`${server.name} now listening at ${server.url}`);
});

const adapter = new botbuilder.BotFrameworkAdapter({
    appId : process.env.MICROSOFT_APP_ID,
    appPassword : process.env.MICROSOFT_APP_PASSWORD
});

const userState = new botbuilder.UserState(new botbuilder.MemoryStorage());
adapter.use(userState);

const conversationState = new botbuilder.ConversationState(new botbuilder.MemoryStorage());
adapter.use(conversationState);

server.post('/api/messages', (req,res) => {
    adapter.processActivity(req, res, async(context) => {
        if(context.activity.type === 'message') {
            const user = userState.get(context);
            const state = conversationState.get(context);
            if(!state.prompt){
                state.prompt = 'githubId';  //seems like this should be better defined
                await context.sendActivity(`What is the github user ID you want to see repos for?`);
            } else if (state.prompt === 'githubId') {
                user.githubId = context.activity.text;
                await context.sendActivity(`Thanks, I'll use ${user.githubId} as your github Id.`).then( () => options.uri = "https://api.github.com/users/" + user.githubId + "/repos").catch( (err) => {console.log(err);});
                await rp(options)
                .then(function (repos) {
                    let data = new Array();
                    repos.forEach( (e) => {
                        data.push(e.name);
                        //console.log(e.name);
                    });
                    user.repos = data;
//                    context.sendActivity(data.toString()).catch( (e) => console.log(e));
                }) 
                .catch( (err) => {
                    // API call failed...
                    console.log(err);
                });
                await context.sendActivity(user.repos.toString()).catch( (err) => {console.log(err);});;
                state.prompt = "reposReturned";
            } else if (state.prompt === "reposReturned") {
                console.log(user);
            };
        };
    })
});
    