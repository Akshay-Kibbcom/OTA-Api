var express = require('express')
var bodyParser = require("body-parser");
var path = require('path');
var router = express.Router();
var multer = require('multer');
const fs = require('fs');
var crypto = require('crypto');
const dir = './firmware';
var app = express()

app.use(bodyParser.json());
var checkSum ;


var Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./firmware");
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});

var upload = multer({ storage: Storage }).array("imgUploader", 3); //Field name and max count

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.post("/upload", function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            return res.end("Something went wrong!");
        }
        return res.end("File uploaded sucessfully!.");
    });
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
// Genaret Checksum Function
function generateChecksum(str, algorithm, encoding) {
    
    checksumReturn = crypto
        .createHash(algorithm || 'md5')
        .update(str, 'utf8')
        .digest(encoding || 'hex');

        console.log("Check : "+checksumReturn)
}

// Get New Version is available of not.
app.post('/getVersionUpdates', function (req, res) {
    var body=req.body;
    var filename= body.filename;
    console.log("File in URL Body is : "+filename)

    var lastChar = filename[filename.length-1];
    var ver= parseInt(lastChar)
    ver++;
    console.log(ver);
    var newFile=filename.replace(lastChar,ver);
    console.log(newFile);
    console.log(path.resolve("./firmware/"+newFile+".txt"));


    var ret=getFileExists(newFile);

    var fileExist;
    
    ret.then(function(result){
        console.log("Result: "+result)
        console.log('./firmware/'+newFile+".txt");
        
        fs.readFile('./firmware/'+newFile+".txt", function(err, data) {
            console.log(data)
            generateChecksum(data); 
            console.log(checksumReturn)  
            var response={
                Result : "New Updates Available",
                URL : "http://159.65.152.85:4000"+path.resolve("./firmware/"+newFile+".txt"),
                Checksum : checksumReturn
            }
            res.send(response);
        });
    },function(err)
    {
        console.log(err)
        var response ={
            Result : "No Updates Available, You are upto date"
        }
        res.send(response);
    })
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
    console.log('Magic is happening on port 3000!')
})