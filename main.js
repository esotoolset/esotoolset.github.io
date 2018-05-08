const readFileAsText = (inputFile) => {
  return new Promise((resolve, reject) => {
    const temporaryFileReader = new FileReader();
	temporaryFileReader.onerror = () => {
      temporaryFileReader.abort();
      reject(new DOMException("Problem parsing input file."));
    };

    temporaryFileReader.onload = () => {
      resolve(temporaryFileReader.result);
    };
    temporaryFileReader.readAsText(inputFile);
  });
};

function luaToJson(str){
	return JSON.parse(str.replace(/MM\d\dDataSavedVariables =/,"")
	.replace(/\[(.*)\]/g,'"$1\"')
	.replace(/\\\"/g,"'")
	.replace(/\"\"(.*)\"\"/g,"\"$1\"")
	.replace(/\=/g,":")
	.replace(/[\t\r\n]/g,"")
	.replace(/\s\s+/g," ")
	.replace(/,\s?(\}|\])/g,"$1"));
}

function unwrapJSON(input){
	var output = [];
	salesData = input.Default.MasterMerchant.$AccountWide.SalesData
	var itemIDs = Object.keys(salesData);
	itemIDs.forEach(function(itemID){
		var instances = salesData[itemID];
		var instanceIDs = Object.keys(instances);
		instanceIDs.forEach(function(instanceID){
			var instance = instances[instanceID];
			var name = instance.itemDesc;
			var details = instance.itemAdderText;
			var sales = instance.sales;
			var salesIndices = Object.keys(sales);
			salesIndices.forEach(function(saleIndex){
				var sale = sales[saleIndex];
				var buyer = sale.buyer;
				var guild = sale.guild;
				var id = sale.id;
				var itemLink = sale.itemLink;
				var price = sale.price;
				var quant = sale.quant;
				var seller = sale.seller;
				var timestamp = sale.timestamp;
				var wasKiosk = sale.wasKiosk;
				
				var saleRecord = [itemID,instanceID,name,details,buyer,guild,id,itemLink,price,quant,seller,timestamp,wasKiosk]
				output.push(saleRecord);
			});			
		});
	});
	return output;
}

function addHeaders(data){
	return [["itemID","instanceID","name","details","buyer","guild","id","itemLink","price","quantity","seller","timestamp","wasKiosk"]].concat(data);
}

//exporttoCsv taken from Stack Overflow, seems to suit purpose.
function exportToCsv(filename, rows) {
	var processRow = function (row) {
		var finalVal = '';
		for (var j = 0; j < row.length; j++) {
			var innerValue = row[j] === null ? '' : row[j].toString();
			if (row[j] instanceof Date) {
				innerValue = row[j].toLocaleString();
			};
			var result = innerValue.replace(/"/g, '""');
			if (result.search(/("|,|\n)/g) >= 0)
				result = '"' + result + '"';
			if (j > 0)
				finalVal += ',';
			finalVal += result;
		}
		return finalVal + '\n';
	};

	var csvFile = '';
	for (var i = 0; i < rows.length; i++) {
		csvFile += processRow(rows[i]);
	}

	var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
	if (navigator.msSaveBlob) { // IE 10+
		navigator.msSaveBlob(blob, filename);
	} else {
		var link = document.createElement("a");
		if (link.download !== undefined) {
			var url = URL.createObjectURL(blob);
			link.setAttribute("href", url);
			link.setAttribute("download", filename);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}
}

function readFiles(evt) {
	var files = Array.from(evt.target.files);
	if (files){
		Promise.all(files.map(readFileAsText))
		.then(function(v){return v.map(luaToJson)})
		.then(function(v){return v.map(unwrapJSON)})
		.then(function(v){return v.reduce((a, b) => a.concat(b), []);})
		.then(function(v){return addHeaders(v)})
		.then(function(v){exportToCsv("merchant.csv",v)});
	} else {
		alert("OH NO, SOMETHING BROKE");
	}
}

document.getElementById('fileinput').addEventListener('change', readFiles, false);
