var express = require('express');
var router = express.Router();

var bcrypt = require('bcrypt');
var session = require('express-session')
var async = require('async');
/* GET users listing. */



router.get('/all', function(req, res) {
    var db = req.db;
    
     // var cypher = "START x = node({id}) "
     //       + "MATCH x -[r:DURATION]-> n "
     //       + "RETURN n "
     //       + "ORDER BY n.title";
    //var cypher ="MATCH (n:Mrt) RETURN n LIMIT 25";
    //var cypher ='MATCH p=shortestPath((a:Mrt {title:"Jurong East"})-[*]-(meg:Mrt {title:"Dover"})) RETURN p';
    //var cypher ='MATCH p = allShortestPaths((a:Mrt { title: "Jurong East" })-[r:DURATION*]-(b:Mrt { title: "Dover" })) RETURN p ORDER BY length(p) DESC';
    //var cypher = ' MATCH p = shortestPath((a:Mrt { title: "Jurong East" })-[r:DURATION]-(b:Mrt { title: "Dover" })) RETURN p';
	//var cypher ='MATCH (a:SGMRT { id: 38 }), (b:SGMRT { id: 44 }) , p = allShortestPaths((a)-[:DURATION*]->(b)) WITH REDUCE(dist = 0, rel in rels(p) | dist + rel.mins) AS distance, p RETURN p, distance ORDER BY length(p) DESC';
	var data;
	 async.parallel([
        //Load user
        function(callback) {
            
            var cypher='MATCH (n:`SGMRT`) RETURN n ORDER BY n.name';
			db.query(cypher, {}, function(err, result) {
			  if (err) throw err;
			  data=result;
			  callback();
			});
        }

     
    
   
  
 

    ], function(err) { 
        if (err) return next(err); 
	res.header("Access-Control-Allow-Origin", "*");
 	res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.send(data)
    });






    
});

router.get('/pathById/:from/:to', function(req, res) {
    var db = req.db;
    
var cypher ='MATCH (a:SGMRT { stationid: '+req.params.from+' }), (b:SGMRT { stationid: '+req.params.to+' }) , p = allShortestPaths((a)-[:DURATION*]->(b)) WITH REDUCE(dist = 0, rel in rels(p) | dist + rel.mins) AS distance, p RETURN p, distance ORDER BY length(p) DESC';
        db.query(cypher,  function(err, result) {
                          if (err)
                                throw err;
               // resp(result,db,function(err, response) {
                   // res.send(result)          
                    res.send(result)
               //});

        });
    
});

router.post('/path/:id', function(req, res) {
    var db = req.db;
/*	var cypher = "START x = node({id}) "
           + "MATCH x -[r]-> n "
           + "RETURN n "
           + "ORDER BY n.name";
*/
var OrderList = req.param('order');
var cypher = "match (n:SGMRT) where n.stationid="+req.params.id+" "
           + "return n";
db.query(cypher, {id: 254}, function(err, result) {
  if (err) throw err;
	db.save(result, 'orderName', OrderList, function(err) {
		if (err) throw err;
		res.send(result)
        });



});

/*	db.save({ name: 'Jon', age: 23 }, 'Person', function(err, node) {
  		db.save(node, 'age', 24, function(err) {
  		});
	});*/











    
});


router.get('/shortestPath/:from/:to',function(req,res){
	
	var db = req.db;
	var cypher ='MATCH (a:SGMRT { stationid: '+req.params.from+' }), (b:SGMRT { stationid: '+req.params.to+' }) , p = allShortestPaths((a)-[:DURATION*]->(b)) WITH REDUCE(dist = 0, rel in rels(p) | dist + rel.mins) AS distance, p RETURN p, distance ORDER BY length(p) DESC';
	db.query(cypher,  function(err, result) {
			  if (err) 
			  	throw err;
		resp(result,db,function(err, response) {
	           // res.send(result)		
			 res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
		    res.send(response)
		});
	
	});
});


var resp = function(result,db,callback) {

			responseObj=[];
			// callback(undefined, result);
	        async.eachSeries(result, function(items, callback) {
	        	
	        		rest=items.p.relationships;
	        		nod=items.p.nodes;
				start=items.p.start;
				end=items.p.end;
			      //  console.log(items);		
	        		temp={}
				temp.hop=items.p.length;
				temp.mins=items.distance;
				
	        		
	        		async.parallel([
					function (callback){
						var url=start.split('/');
                                                                var operation = db.operation('node/'+url[url.length-1]+'/properties');
                                                                db.call(operation, function(err, properties) {
                                                                        if (err) throw err;
                                                                        temp.start=properties;
                                                                        callback();
                                                                });
					},
					function (callback){
                                                var url=end.split('/');
                                                                var operation = db.operation('node/'+url[url.length-1]+'/properties');
                                                                db.call(operation, function(err, properties) {
                                                                        if (err) throw err;
                                                                        temp.end=properties;
                                                                        callback();
                                                                });
                                        },
    					function(callback){
    						temp.relationships={};
    						async.each(Object.keys(rest), function(relation, callback) {
    							var url=rest[relation].split('/');
								var operation = db.operation('relationship/'+url[url.length-1]+'/properties');
								db.call(operation, function(err, properties) {
									if (err) throw err;
									temp.relationships[relation]=properties;
									callback();
								});
							}, function(err){
							    // if any of the file processing produced an error, err would equal that error
							    if( err ) {
							      // One of the iterations produced an error.
							      // All processing will now stop.
							      console.log('A file failed to process');
							    } else {

							      callback();
							    }
							});
						},
    					function(callback){	
	    					temp.nodes={}								     
		                	async.each(Object.keys(rest), function(node, callback) {
		        				var url=nod[node].split('/');
								var operation = db.operation('node/'+url[url.length-1]+'/properties');
								db.call(operation, function(err, properties) {
									 if (err) throw err;
									 temp.nodes[node]=properties;
									callback();
								});
							}, function(err){
							    // if any of the file processing produced an error, err would equal that error
							    if( err ) {
							      // One of the iterations produced an error.
							      // All processing will now stop.
							      console.log('A file failed to process');
							    } else {

							      callback();
							    }
							});
			        	 }
						],
						// optional callback
						function(err, results){
				//			console.log(temp)
							responseObj.push(temp);
	            			callback();
						});
				
				
	        }, function(err) {
	        	
	        	// callback();
	        	callback(undefined, responseObj);
	        });
	
};

module.exports = router;

