//add dependencies
var request = require('request');
var rp = require('request-promise');
var cheerio = require('cheerio');
var json2csv = require('json2csv');
var fs = require('fs');
var moment = require('moment');
var path = require('path');
var dir = './data';
var error = './scrapper_error.log';
var rimraf = require('rimraf');
var shirtUrls=[];
var fields = ['Title', 'Price', 'ImageURL', 'URL', 'Time'];
var csv='';
var shirtLinks=[];
//set options for entry point
var options = {
     uri: 'http://shirts4mike.com/shirts.php',
     transform: function (body) {
         return cheerio.load(body);
     }
};

//first check that the data folder is present. If not, create it.
var checkFile = function() {
   var promise = new Promise(function(resolve, reject){
      if(!fs.existsSync(dir)){ //if data folder does not exist create the data folder
             fs.mkdirSync(dir);
             console.log("data directory made");
         }
         else if(fs.existsSync(dir)){// if data folder does exist remove all files
             rimraf(dir, ()=>{
                 fs.mkdirSync(dir);
                 console.log("old csv file removed");
             });
             rimraf('./scrapper_error.log',()=>{//delete the scrapper_error.log file if results are received
              console.log("old error log file removed");
             });
         }
resolve({});
   });
   return promise;
};

//uses options to open the website and scraper the individual urls
var getUrls = function() {
   var promise = new Promise(function(resolve, err){
    // request('http://shirts4mike.com/shirts.php', function (error, response, body) {
     request('https://calm-spire-44416.herokuapp.com', function (error, response, body) {
     if (!error && response.statusCode == 200) {
     var $ = cheerio.load(body);
      $('ul.products').find("li").each(function(i, element){
         var shirtLink=$(this).children("a").attr("href");
         //var shirtLinkUrl='http://shirts4mike.com/' + shirtLink;
         var shirtLinkUrl='https://calm-spire-44416.herokuapp.com/' + shirtLink;
         shirtUrls.push(shirtLinkUrl); //urls saved in array
         shirtLinks.push(shirtLink);
          });
}else {
   console.log("error reaching website: shirts4mile.com");
}
resolve(shirtUrls);
});
   });
   return promise;
};

//make calls to individual shirt urls and save them in a .csv file
var makeCsv = function(urls) {
   var shirts=[];
   var promise = new Promise(function(resolve, reject){

      var counter=0;

for(var i=0; i<shirtLinks.length;i++){

            var link= 'https://calm-spire-44416.herokuapp.com/'+shirtLinks[i];

         request(link, function (error, response, body) {
          if (!error && response.statusCode == 200) {
                          counter++;
                           var $ = cheerio.load(body);
                            var title=$('head title').text();
                           var price=$('.price').text();
                           var imgSrc=$('.shirt-picture').find('span img').attr('src');
                           var imgUrl= 'https://calm-spire-44416.herokuapp.com/' + imgSrc;


//format the the current time.
                            var date =   moment(new Date()).format('YYYY-MM-DD');
                            var time=    moment(new Date()).format('MMMM Do YYYY, h:mm a');
                            var shirt= new Object();
                             shirts[counter]=shirt;
 //make shirt Object

         shirt.Title = title;
         shirt.Price=price;
         shirt.ImageURL = imgUrl;
         shirt.URL=link;
         shirt.Time=time;

         shirts.push(shirt);

//write each object to file
       csv = json2csv({ data: shirts, fields: fields });

fs.writeFile(dir + '/' + date + '.csv', csv, function(error){
           if (error){
              var errormsg = "Invalid url. csv file NOT saved";
              fs.writeFile('./scraper_error.log', errormsg + "  " + time, (error)=>{
                 console.log(" error log file created.");
                 return console.log(errormsg);
              });

           }else if(shirts.length !=0) {
                console.log('new csv file saved');
           }

              });
           }else {
              console.log("Error reaching shirt details page.  Error code: " +  response.statusCode);
           }
         });
}//for loop

         resolve({result: csv});

      });
   return promise;
  };
//call the methods using promises.
checkFile()
   .then(getUrls)
   .then(makeCsv);
