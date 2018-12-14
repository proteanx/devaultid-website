const Uint8ArrayfromHexString = hexString => new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
const Uint8ArraytoHexString = bytes => bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

const cash_account_height_modifier = 560000;

window.parseHexString = function(str)
{ 
	var result = [];

	while (str.length >= 8)
	{ 
		result.push(parseInt(str.substring(0, 8), 16));

		str = str.substring(8, str.length);
	}

	return result;
}

/* Triggered when typing in a new account name for registration */
let update_name = function()
{
	// Get the name string as a blob for further processing.
	let name = new Blob([document.getElementById('alias_name').value]);

	// Create a file reader to get data from the blob.
	let fileReader = new FileReader();

	// Set up a function that can convert a byte array to a hex-encoded string.
	let byteArrayToHexString = function(byteArray)
	{
		return Array.prototype.map.call
		(
			byteArray, 
			function(byte)
			{
				return ('0' + (byte & 0xFF).toString(16)).slice(-2);
			}
		).join('');
	}

	// When the file reader has loaded the blob data..
	fileReader.onload = function()
	{
		// Store the name as a byte array.
		let nameBytes = new Uint8Array(fileReader.result);

		// Update the OP_PUSH byte length indicator.
		document.getElementById('alias_name_length').setAttribute('title', fileReader.result.byteLength + ' bytes');
		document.getElementById('alias_name_length').innerHTML = (fileReader.result.byteLength).toString(16).padStart(2, '0');

		// Update the OP_PUSH byte data for the name string.
		document.getElementById('alias_name_hex').setAttribute('title', 'UTF-8 encoded name from: ' + document.getElementById('alias_name').value);
		document.getElementById('alias_name_hex').innerHTML = byteArrayToHexString(nameBytes);

		// Update the predicted identifiers name part.
		document.getElementById('alias_name_predication').innerHTML = document.getElementById('alias_name').value;

		// alias_name_lookup_button
		document.getElementById('alias_name_lookup_button').innerHTML = document.getElementById('alias_name_lookup_button').innerHTML.replace(/(Lookup: )(\w+)#(\d+)/, '$1' + document.getElementById('alias_name').value + '#$3');
	};

	// Load the name blob.
	fileReader.readAsArrayBuffer(name);
}

let lookup_identifier = function(identifier)
{
	let parser = /^([a-zA-Z0-9_]+)#([0-9]+)(\.([0-9]+))?;$/;
	let account_parts = parser.exec(identifier.trim());

	if(account_parts)
	{
		let account_name = account_parts[1];
		let account_number = parseInt(account_parts[2]) + cash_account_height_modifier;
		let account_hash = account_parts[4];

		let query =
		{
			"v": 3,
			"q": {
				"find": { "out.h1": "01010101", "out.s2": { "$regex": "^" + account_name, "$options": "i" }, "blk.i": parseInt(account_number) },
				"limit": 5
			},
			"r": {
				"f": "[ .[] | { blockheight: .blk.i?, blockhash: .blk.h?, transactionhash: .tx.h?, name: .out[0].s2, data: .out[0].h3} ]"
			}
		}

		//console.log(query);

		let base64_query = btoa(JSON.stringify(query));
		let url = "https://bitdb.network/q/" + base64_query;

		let header =
		{
			headers: { key: "qqdd9rf6uf2l2h4uzjdkqgqqeg4rpw25e53lus6qrt" }
		};

		fetch(url, header).then
		(
			function(r)
			{
				return r.json()
			}
		).then
		(
			function(results)
			{
				// Clear previous result.
				document.getElementById('result_list').innerHTML = "";

				let transaction_types = ['u', 'c'];
				let payment_types =
				{
					'01': "Key Hash",
					'02': "Script Hash",
					'03': "Payment Code",
					'04': "Stealth Keys"
				}

				let payment_data_types =
				{
					'01': "P2PKH",
					'02': "P2SH",
					'03': "????",
					'04': "????"
				}

				//console.log(results);

				for(type in transaction_types)
				{
					//console.log('Parsing TYPE: ' + transaction_types[type]);
					//console.log(results[transaction_types[type]]);

					for(index in results[transaction_types[type]])
					{
						let account_name = results[transaction_types[type]][index]['name'];
						let account_number = results[transaction_types[type]][index]['blockheight'] - cash_account_height_modifier;
						let account_hash = "unknown";
						let block_height = results[transaction_types[type]][index]['blockheight'];
						let block_hash = results[transaction_types[type]][index]['blockhash'];
						let transaction_id = results[transaction_types[type]][index]['transactionhash'];

						let payment_type = payment_types[results[transaction_types[type]][index]['data'].substring(0,2)];
						let payment_data = results[transaction_types[type]][index]['data'].substring(2);

						// Calculate the account hash:
						// Step 1: Concatenate the block hash with the transaction hash
						let account_hash_step1 = block_hash + transaction_id;
//console.log(account_hash_step1);
						// Step 2: Hash the results of the concatenation with sha256
						let account_hash_step2 = sha256(window.parseHexString(account_hash_step1));
//console.log(account_hash_step2);
						// Step 3: Take the first four bytes and discard the rest
						let account_hash_step3 = account_hash_step2.substring(0, 8);
//console.log(account_hash_step3);
						// Step 4: Convert to decimal notation and store as a string
						let account_hash_step4 = parseInt(account_hash_step3, 16);
//console.log(account_hash_step4);
						// Step 5: Reverse the the string so the last number is first
						let account_hash_step5 = account_hash_step4.toString().split("").reverse().join("");
//console.log(account_hash_step5);

						// Calculate the address:
						/*
						let temp = cashaddr.decode('bitcoincash:qr4aadjrpu73d2wxwkxkcrt6gqxgu6a7usxfm96fst');
						console.log(temp);
						console.log('decode_hash: ' + Uint8ArraytoHexString(temp.hash));
						console.log('payment_data: ' + payment_data);
						console.log(cashaddr.encode('bitcoincash', 'P2PKH', Uint8ArrayfromHexString(payment_data)));
						*/

						let account_address_type = payment_data_types[results[transaction_types[type]][index]['data'].substring(0,2)];
						let account_address = cashaddr.encode('bitcoincash', account_address_type, Uint8ArrayfromHexString(payment_data));
						
						document.getElementById('result_list').innerHTML = "<tr><td>" + account_name + "</td><td>#" + account_number + "</td><td>." + account_hash_step5 + "</td><td><a href='https://blockchair.com/bitcoin-cash/transaction/" + transaction_id + "' title='" + transaction_id + "'>" + transaction_id.substring(0,4) + "..." + transaction_id.substring(transaction_id.length - 4) + "</a></td><td><a href='https://blockchair.com/bitcoin-cash/block/" + block_height + "'>" + block_height + "</a></td><td>" + payment_type + "</td><td><a href='https://blockchair.com/bitcoin-cash/address/" + account_address.substring(12) + "'>" + account_address + "</a></td></tr>";
						console.log(results[types[type]][index]);
					}
				}
			}
		);
	}
}
