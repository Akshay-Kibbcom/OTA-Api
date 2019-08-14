var express = require('express')
var bodyParser = require("body-parser");
var path = require('path');
var router = express.Router();
var multer = require('multer');
const fs = require('fs');
var crypto = require('crypto');
var querystring = require('querystring');
var http = require('http');
const dir = './firmware';
const camDir = './camfirmware';
var app = express()

app.use(bodyParser.json());
 
// Fido Firmware Directory
var Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, dir);
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});

// Cam Firmware Directory
var camStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, camDir);
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});


var upload = multer({ storage: Storage }).array("imgUploader", 3); //Field name and max count

var camUpload = multer({ storage: camStorage }).array("camimgUploader", 3);

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

function getFileSize(filename)
{
    fs.readdir(dir, (err, files) => {
        files.forEach(file => {
            if(file.indexOf(filename) == -1 ?false:true)
            {
                console.log("Update file name : "+file);
                newFile=file;
                console.log("./firmware/"+newFile)
                // Get File Size
                const stats = fs.statSync("./firmware/"+newFile)
                const fileSizeInBytes = stats.size
                return fileSizeInBytes;
            }
        })
    });
}

function sendNotification()
{
    // Get File Size
    //var filesize= getFileSize(maxValue);
    //console.log(filesize);

    // Build the post string from an object
    var post_data =JSON.stringify( {
        "Result" : "New Fido Updates Available"
    })

    // An object of options to indicate where to post to
    var post_options = {
        host: '159.65.152.85',
        port: '8000',
        path: '/newversion',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            //'Content-Length': Buffer.byteLength(post_data)
        }
    }

    // Set up the request
    var post_req = http.request(post_options, function(res) {
    });

    // post the data
    post_req.write(post_data.toString());
    post_req.end();
}

app.post("/upload", function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            return res.end("Something went wrong!");
        }
        return res.end("File uploaded sucessfully!.");
    });
    sendNotification();
});

app.post("/uploadCam", function (req, res) {
    console.log("Upload Cam");
    camUpload(req, res, function (err) {
        if (err) {
            return res.end("Something went wrong!");
        }
        return res.end("File uploaded sucessfully!.");
    });
    //sendNotification();
});



// Check File Exist or Not
function getFileExists(filename)
{
    console.log("Inside File Exist Function")
    var promise= new Promise(function(resolve,reject){
        fs.readdir(dir, (err, files) => {
            files.forEach(file => {
                var fname= file.slice(0, -4);
                if(fname==filename)
                {
                    console.log("File Exist")
                    return resolve(1);
                }
            })
            return reject(0)
        })
    });
    return promise;
}

var checksumReturn;
var fileVersions=new Array();
// Genaret Checksum Function
function generateChecksum(str, algorithm, encoding) {
    
    checksumReturn = crypto
        .createHash(algorithm || 'md5')
        .update(str, 'utf8')
        .digest(encoding || 'hex');

        console.log("Check : "+checksumReturn)
}
// Get Maximum Number
async function getMaxVer(path)
{
    //var promise= new Promise(function(resolve,reject){
        files = fs.readdirSync(path)
            fileVersions = [];
            files.forEach(file => {
                console.log(file)
                var fname= file.slice(0, -4);
                var ver= fname.split("_")
                //console.log("Ver ",ver)
                ver=ver[1];
                fileVersions.push(ver);
                
            })
            //console.log("Vers ", fileVersions )
            //return resolve(Math.max(...fileVersions))
        //})
        return Math.max(...fileVersions)
    //});
    //return promise;
}

// Get New Version is available of not.
app.post('/getVersionUpdates', async function (req, res) {

    var fidoCheckSum ;
    var fidoFirmURL ; 
    var fidoFirmSize ;
    var fidoUpdate ;


    var body=req.body;
    var filename= body.currentVersion;
    var camVersion = body.currentCamVersion;
    console.log("Fido Version in URL Body is : "+filename)
    console.log("Cam Version in URL Body is : "+camVersion)

    /*// Truncate the Extn
    var filname= filename.slice(0,-4);
    console.log("File without EXTN "+filname);
    */
    //Fido Firmware Split
    var lastChar = filename.split("_")
    lastChar=lastChar[1];
    console.log(lastChar);
    var ver= parseInt(lastChar)
    //ver++;
    var max= await getMaxVer(dir);
    console.log("Fido Max", max)

    // Cam Firmware Split
    var camlastChar = camVersion.split("_")
    camlastChar=camlastChar[1];
    console.log(camlastChar);
    var Camver= parseInt(camlastChar)

    var camMax = await getMaxVer(camDir);

    console.log("Cam Version", Camver)
    console.log("Cam Max", camMax)

    // Fido Firmware File URL
    //var res = await max.then(result => result.data)
    // var res = await max.then(function(maxValue){
    if(max>ver)
    {
        var newFile;
        files = fs.readdirSync(dir)
            //, (err, files) => {
            files.forEach(file => {
                if(file.indexOf(max) == -1 ?false:true)
                {
                    console.log("Update file name : "+file);
                    newFile=file;
                    console.log("./firmware/"+newFile)
                    // Get File Size
                    const stats = fs.statSync("./firmware/"+newFile)
                    const fileSizeInBytes = stats.size
                    //Convert the file size to megabytes (optional)
                    //const fileSizeInMegabytes = fileSizeInBytes / 1000000.0

                    data = fs.readFileSync('./firmware/'+newFile)
                    console.log("Data ", data)
                    // , function(err, data) {
                    // console.log(data)
                    generateChecksum(data); 
                    console.log(checksumReturn)  
                    // var response={
                    //         Confirmed : 0,
                    //         Result : "New Updates Available",
                    //         URL : "http://159.65.152.85:4000/download/"+newFile,
                    //         Checksum : checksumReturn,
                    //         Filesize : fileSizeInBytes
                    //     }
                    //     res.send(response);
                    fidoUpdate = true; 
                    fidoFirmURL = "http://159.65.152.85:4000/download/"+newFile;
                    fidoCheckSum = checksumReturn;
                    fidoFirmSize = fileSizeInBytes;
                    //});
                }
            //})

        })
    }

    data = '';
    checksumReturn = ''
    fileSizeInBytes = ''
    newFile = ''

    // })
    //console.log("Res ", res)

    console.log("Fido Update", fidoUpdate)
    console.log("Fido URL", fidoFirmURL)
    console.log("Fido Checksum", fidoCheckSum)
    console.log("Fido FileSize", fidoFirmSize)
    // Camera Firmware File URL

    // camMax.then(function(maxVersion){
    //     console.log("Cam Max", maxVersion)
    if(camMax>Camver)
    {
        var newFile;
        fs.readdir(camDir, (err, files) => {
            files.forEach(file => {
                if(file.indexOf(camMax) == -1 ?false:true)
                {
                    console.log("Update file name : "+file);
                    newFile=file;
                    console.log("./camfirmware/"+newFile)
                    // Get File Size
                    const stats = fs.statSync("./camfirmware/"+newFile)
                    const fileSizeInBytes = stats.size
                    //Convert the file size to megabytes (optional)
                    //const fileSizeInMegabytes = fileSizeInBytes / 1000000.0

                    fs.readFile('./camfirmware/'+newFile, function(err, data) {
                    console.log(data)
                    generateChecksum(data); 
                    console.log(checksumReturn)  
                    if (fidoUpdate){
                        var response={
                            Confirmed : 0,
                            Result : "New Updates Available",
                            fidoFirmware_URL : fidoFirmURL,
                            fidoFirmware_Checksum : fidoCheckSum,
                            fidoFirmware_Filesize : fidoFirmSize,
                            camFirmware_URL : "http://159.65.152.85:4000/download/"+newFile,
                            camFirmware_Checksum : checksumReturn,
                            camFirmware_Filesize : fileSizeInBytes,
                        }
                    }
                    else{
                        var response={
                            Confirmed : 0,
                            Result : "New Updates Available",
                            camFirmware_URL : "http://159.65.152.85:4000/download/"+newFile,
                            camFirmware_Checksum : checksumReturn,
                            camFirmware_Filesize : fileSizeInBytes,
                        }
                    }
                    // var response={
                    //         Confirmed : 0,
                    //         Result : "New Updates Available",
                    //         URL : "http://159.65.152.85:4000/download/"+newFile,
                    //         Checksum : checksumReturn,
                    //         Filesize : fileSizeInBytes
                    //     }
                        res.send(response);
                    });
                }
            })

        })
    }
    else{
        if(fidoUpdate){
            var response={
                Confirmed : 0,
                Result : "New Updates Available",
                fidoFirmware_URL : fidoFirmURL,
                fidoFirmware_Checksum : fidoCheckSum,
                fidoFirmware_Filesize : fidoFirmSize,
            }
            res.send(response);
        }
        else{
            var response ={
                Confirmed : 1,
                Result : "No Updates Available, You are upto date"
            }
            res.send(response);
        }     
    }
    // })
})


// Download a new Firmware
app.get('/download/:file(*)',(req, res) => {
    var file = req.params.file;
    fs.readFile('firmware/'+file, function (err, content) {
        if (err) {
            res.writeHead(400, {'Content-type':'text/html'})
            console.log(err);
            res.end("No such file");    
        } else {
            //specify Content will be an attachment
            res.setHeader('Content-disposition', 'attachment; filename='+file);
            res.end(content);
        }
    });
  });


app.listen(4000, function () {
    console.log('Magic is happening on port 4000!')
})