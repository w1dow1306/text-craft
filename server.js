console.clear();

//imports 

const express = require('express')
const cookieparser = require('cookie-parser')
const app = express();
app.use(express.static(__dirname))
app.use(cookieparser());
app.use(express.json())
const path = require('path')
const fs = require('fs');
const { google } = require('googleapis');


//variables
const port = 8000; 
let creds = JSON.parse(fs.readFileSync(path.join(__dirname, 'creds.json'), 'utf8'));
const auth = new google.auth.OAuth2(creds.web.client_id, creds.web.client_secret, creds.web.redirect_uris);




//ROutes


app.get("/auth/google", (req, res) => {
    const authUrl = auth.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive'],
    });
    res.redirect(authUrl)
})


app.get("/redirect", async (req, res) => {

    // GOogle auth page

    res.clearCookie('googletokens');
    const { code } = req.query;
    const { tokens } = await auth.getToken(code);
    auth.setCredentials(tokens);
    const id = await cfolder();
    console.log(id);
    res.cookie("googletokens", JSON.stringify(tokens));
    res.cookie("f_id", id);
    res.send(`
        <p>${tokens}</p>
        <a href="/">Go back to page</a>
    `);
}
)

app.get("/", (req, res) => {
    ///SERving the index

    res.sendFile(path.join(__dirname + "/index.html"));
});


app.post("/upload", async (req, res) => {

    ////UPloading the files

    const tokens = JSON.parse(req.cookies.googletokens)
    auth.setCredentials(tokens);
    const name = req.body.name;
    const code = req.body.code;
    const parent = req.cookies.f_id;
    res.json(await cfile(name, code, parent))
})

async function cfile(name, code, parent) {

    // Handling files
    const drive = google.drive({ version: 'v3', auth });


    const files = await drive.files.list({
        q: `name contains '${name}' and '${parent}' in parents`,
        fields: "files(id,name)",
        trashed: false
    });


//If files exist update the file
    if (files.data.files.length > 0) {
        const fileId = files.data.files[0].id;
        const res = await drive.files.update({
            fileId: fileId,
            media: {
                mimeType: "text/plain",
                body: code
            }
        });
        console.log('File updated:', res.data);



    } else {
        
        
        //if file doesn't exist create a new file and return the id
        const res = await drive.files.create({
            resource: {
                name: name,
                mimeType: "text/plain",
                parents: [parent]
            },
            media: {
                mimeType: "text/plain",
                body: code
            },
            fields: 'id, name' 
        });
        console.log('File created:', res.data);
    }
}







//folders
async function cfolder() {
    
    // Create a text-craft folder for initialistation

    const drive = google.drive({ version: 'v3', auth });
    try {
        const listRes = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and name='text-craft'",
            fields: 'files(id, name)',
            trashed: false
        });

        if (listRes.data.files.length > 0) {
            console.log(listRes.data.files[0]);
            return listRes.data.files[0].id;
        } else {
            const createRes = await drive.files.create({
                resource: {
                    name: "text-craft",
                    mimeType: 'application/vnd.google-apps.folder',
                },
                fields: 'id, name'
            });
            const folder = createRes.data;
            console.log('Folder created:', folder);
            return folder.id;
        }
    } catch (error) {
        console.error('Error checking/creating folder:', error);
        throw error;
    }
}


app.listen(port, () => {
    console.log("Server running on http://localhost:8000/")
})