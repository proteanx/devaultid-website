const Uint8ArrayfromHexString = hexString => new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
const Uint8ArraytoHexString = bytes => bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

// Set up a function that can convert a byte array to a hex-encoded string.
const byteArrayToHexString = function(byteArray)
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

const postData = function(url = ``, data = {})
{
	// Default options are marked with *
	return fetch(url, {
		method: "POST", // *GET, POST, PUT, DELETE, etc.
		mode: "no-cors", // no-cors, cors, *same-origin
		cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
		credentials: "omit", // include, *same-origin, omit
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			// "Content-Type": "application/x-www-form-urlencoded",
		},
		redirect: "error", // manual, *follow, error
		referrer: "no-referrer", // no-referrer, *client
		body: JSON.stringify(data), // body data type must match "Content-Type" header
	})
	.then(response => response.json()); // parses response to JSON
}

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

let pushcode = function(length)
{
	if(length == 0) { return false; }
	if(length <= 75) { return length.toString(16).padStart(2, '0').toUpperCase(); }
	if(length <= 256) { return "4c" + length.toString(16).padStart(4, '0').toUpperCase(); }
	if(length <= 256*256) { return "4d" + length.toString(16).padStart(6, '0').toUpperCase(); }
	if(length <= 256*256*256*256) { return "4e" + length.toString(16).padStart(10, '0').toUpperCase(); }
}

let register_account = function()
{
	let account =
	{
		"requested_alias": document.getElementById('alias_name').value,
		"payment_data": document.getElementById('alias_payload').value
	};

	console.log('Registering ' + account.requested_alias + " [" + account.payment_data + "] by posting to https://www.cashaccount.info/alias"); 
	alert(postData('https://www.cashaccount.info/alias', JSON.stringify(account)));
}

/* Triggered when typing in a new account name for registration */
let update_name = function()
{
	// Get the name string as a blob for further processing.
	let name = new Blob([document.getElementById('alias_name').value]);

	// Create a file reader to get data from the blob.
	let fileReader = new FileReader();

	// When the file reader has loaded the blob data..
	fileReader.onload = function()
	{
		// Store the name as a byte array.
		let nameBytes = new Uint8Array(fileReader.result);

		// Update the OP_PUSH byte length indicator.
		document.getElementById('alias_name_length').setAttribute('title', 'Push ' + fileReader.result.byteLength + ' bytes');
		document.getElementById('alias_name_length').innerHTML = pushcode(fileReader.result.byteLength);

		// Update the OP_PUSH byte data for the name string.
		document.getElementById('alias_name_hex').setAttribute('title', 'UTF-8 encoded name from: ' + document.getElementById('alias_name').value);
		document.getElementById('alias_name_hex').innerHTML = byteArrayToHexString(nameBytes).toUpperCase();

		// Update the predicted identifiers name part.
		document.getElementById('alias_name_predication').innerHTML = document.getElementById('alias_name').value;

		// alias_name_lookup_button
		document.getElementById('alias_name_lookup_button').innerHTML = document.getElementById('alias_name_lookup_button').innerHTML.replace(/(Lookup: )(\w+)#(\d+)/, '$1' + document.getElementById('alias_name').value + '#$3');
	};

	// Load the name blob.
	fileReader.readAsArrayBuffer(name);
}

let update_payload = function()
{
	let address = cashaddr.decode('bitcoincash:' + document.getElementById('alias_payload').value);
	let address_types =
	{
		"P2PKH": "Key Hash",
		"P2SH": "Script Hash"
	}
	let address_codes =
	{
		"P2PKH": "01",
		"P2SH": "02"
	}
	
	console.log(address);
	// Update the OP_PUSH byte length indicator.
	document.getElementById('alias_payload_length').setAttribute('title', 'Push ' + (1 + address.hash.length) + ' bytes');
	document.getElementById('alias_payload_length').innerHTML = pushcode((1 + address.hash.length));

	// Update the OP_PUSH byte data for the name string.
	document.getElementById('alias_payload_type').setAttribute('title', 'Type: ' + address_types[address.type]);
	document.getElementById('alias_payload_type').innerHTML = address_codes[address.type];

	// Update the OP_PUSH byte data for the name string.
	document.getElementById('alias_payload_hex').setAttribute('title', 'UTF-8 encoded name from: ' + address.hash.length);
	document.getElementById('alias_payload_hex').innerHTML = byteArrayToHexString(address.hash).toUpperCase();
}

let calculate_collision_hash = function(blockhash, transactionhash)
{
//console.log(blockhhash);
//console.log(transactionhash);

	// Calculate the account hash:
	// Step 1: Concatenate the block hash with the transaction hash
	let account_hash_step1 = blockhash + transactionhash;
//console.log(account_hash_step1);

	// Step 2: Hash the results of the concatenation with sha256
	let account_hash_step2 = sha256(Uint8ArrayfromHexString(account_hash_step1));
//console.log(account_hash_step2);

	// Step 3: Take the first four bytes and discard the rest
	let account_hash_step3 = account_hash_step2.substring(0, 8);
//console.log(account_hash_step3);

	// Step 4: Convert to decimal notation and store as a string
	let account_hash_step4 = parseInt(account_hash_step3, 16);
//console.log(account_hash_step4);

	// Step 5: Reverse the the string so the last number is first
	let account_hash_step5 = account_hash_step4.toString().split("").reverse().join("").padEnd(10, '0');
//console.log(account_hash_step5);

	// Return the final collision hash.
	return account_hash_step5;
}

let calculate_checksum_character = function(blockheight, blockhash, transactionhash)
{
	let emoji_hex_list = ['1f47b', '1f412', '1f415', '1f408', '1f40e', '1f404', '1f416', '1f410', '1f42a', '1f418', '1f401', '1f407', '1f43f', '1f987', '1f413', '1f427', '1f986', '1f989', '1f422', '1f40d', '1f41f', '1f419', '1f40c', '1f98b', '1f41d', '1f41e', '1f577', '1f33b', '1f332', '1f334', '1f335', '1f341', '1f340', '1f347', '1f349', '1f34b', '1f34c', '1f34e', '1f352', '1f353', '1f95d', '1f965', '1f955', '1f33d', '1f336', '1f344', '1f9c0', '1f95a', '1f980', '1f36a', '1f382', '1f36d', '1f3e0', '1f697', '1f6b2', '26f5', '2708', '1f681', '1f680', '231a', '2600', '2b50', '1f308', '2602', '1f388', '1f380', '26bd', '2660', '2665', '2666', '2663', '1f453', '1f451', '1f3a9', '1f514', '1f3b5', '1f3a4', '1f3a7', '1f3b8', '1f3ba', '1f941', '1f50d', '1f56f', '1f4a1', '1f4d6', '2709', '1f4e6', '270f', '1f4bc', '1f4cb', '2702', '1f511', '1f512', '1f528', '1f527', '2696', '262f', '1f6a9', '1f463', '1f35e'];
	
	// Step 1: Concatenate the block emoji with the transaction emoji
	let account_emoji_step1 = blockhash + transactionhash;

	// Step 2: Hash the results of the concatenation with sha256
	let account_emoji_step2 = sha256(Uint8ArrayfromHexString(account_emoji_step1));

	// Step 3: Take the last byte and discard the rest
	let account_emoji_step3 = account_emoji_step2.substring(-2);

	// Step 4: Select an emoji from the emoji_hex_list
	let emoji_index = parseInt(account_emoji_step3, 16) % emoji_hex_list.length;

	// Return the final emoji in decimal notation
	return parseInt(emoji_hex_list[emoji_index], 16);
}

let lookup_identifier = function()
{
	let identifier = document.getElementById('lookup_search_string').value;
	
	let parser = /^([a-zA-Z0-9_]+)(#([0-9]+)(\.([0-9]+))?)?/;
	let account_parts = parser.exec(identifier.trim());

	//console.log(identifier);
	//console.log(account_parts);

	if(identifier === '' || identifier === null)
	{
		account_parts = [null];
	}

	if(account_parts)
	{
		let account_name = account_parts[1];
		let account_number = parseInt(account_parts[3]) + cash_account_height_modifier;
		let account_collision = account_parts[4];

		let query = { "v": 3,"q": { "find": {}, "limit": 9 }, "r": { "f": "[ .[] | { blockheight: .blk.i?, blockhash: .blk.h?, transactionhash: .tx.h?, name: .out[0].s2, data: .out[0].h3} ]" } };

		if(typeof account_parts[3] !== 'undefined')
		{
			query.q.find = { "out.h1": "01010101", "out.s2": { "$regex": "^" + account_name, "$options": "i" }, "blk.i": parseInt(account_number) };
		}
		else
		{
			if(typeof account_parts[1] !== 'undefined')
			{
				query.q.find = { "out.h1": "01010101", "out.s2": { "$regex": "^" + account_name, "$options": "i" } };
			}
			else
			{
				query.q.find = { "out.h1": "01010101" };
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

				// Set up a collision table.
				let collision_table = {};
//console.log('collision_start');
				// Populate the collision table.
				for(index in results['c'])
				{
					let collision_hash = calculate_collision_hash(results['c'][index]['blockhash'], results['c'][index]['transactionhash']);

					if(typeof collision_table[results['c'][index]['blockheight']] == 'undefined')
					{
						collision_table[results['c'][index]['blockheight']] = {};
					}

					if(typeof collision_table[results['c'][index]['blockheight']][results['c'][index]['name']] == 'undefined')
					{
						collision_table[results['c'][index]['blockheight']][results['c'][index]['name']] = {};
					}

					if(typeof collision_table[results['c'][index]['blockheight']][results['c'][index]['name']]['collisions'] == 'undefined')
					{
						collision_table[results['c'][index]['blockheight']][results['c'][index]['name']]['collisions'] = {};
					}

					collision_table[results['c'][index]['blockheight']][results['c'][index]['name']]['collisions'][collision_hash] = collision_hash;
				}
//console.log('collision_mid');

				// Calculate the shortest identifiers.
				for(index in results['c'])
				{
					let collision_hash = calculate_collision_hash(results['c'][index]['blockhash'], results['c'][index]['transactionhash']);
					for(collision in collision_table[results['c'][index]['blockheight']][results['c'][index]['name']]['collisions'])
					{
						let current_collision = collision_table[results['c'][index]['blockheight']][results['c'][index]['name']]['collisions'][collision];
						let length = 10;
						while(length > 0)
						{
							if(collision_hash != current_collision)
							{
//console.log(results['c'][index]['name'] + "#" + results['c'][index]['blockheight']+ ", hash="+collision_hash+", collision=" + current_collision);
								if(collision_hash.substring(0, length) == current_collision.substring(0, length))
								{
									console.log('compared ' + collision_hash.substring(0, length) + " with " + current_collision.substring(0, length));
									break;
								}
								else
								{
								}
							}
							length -= 1;
//console.log('d, length=' + length);
						}

						if(Object.keys(collision_table[results['c'][index]['blockheight']][results['c'][index]['name']]['collisions']).length > 1)
						{
							collision_table[results['c'][index]['transactionhash']] = 1;
						}
						else
						{
							collision_table[results['c'][index]['transactionhash']] = length;
						}
					}
				}
//console.log('collision_end');

//console.log(collision_table);

				for(type in transaction_types)
				{
					//console.log('Parsing TYPE: ' + transaction_types[type]);
					//console.log(results[transaction_types[type]]);

					for(index in results[transaction_types[type]])
					{
						//console.log('A');
						//console.log(parseInt(results[transaction_types[type]][index]['data'].substring(0,2)));
						let account_name = results[transaction_types[type]][index]['name'];
						let transaction_id = results[transaction_types[type]][index]['transactionhash'];
						let account_number = '';
						let block_height = '';
						let block_hash = '';
						let account_hash = '';
						let account_emoji = '';

						if(results[transaction_types[type]][index]['blockheight'] === null)
						{
							account_number = '????';
							block_height = 'Pending';
							block_hash = 'Pending';
							account_hash = '0000000000';
						}
						else
						{
							account_number = results[transaction_types[type]][index]['blockheight'] - cash_account_height_modifier;
							block_height = results[transaction_types[type]][index]['blockheight'];
							block_hash = results[transaction_types[type]][index]['blockhash'];

							account_hash = calculate_collision_hash(block_hash, transaction_id);
							account_emoji = calculate_checksum_character(block_height, block_hash, transaction_id);
						}

						if(typeof account_collision === 'undefined' || account_hash.startsWith(account_collision.substring(1)))
						{
							let account_identifier = "<td><span>" + account_name + "</span></td><td><a href='https://blockchair.com/bitcoin-cash/transaction/" + transaction_id + "'>#" + account_number;
							if(typeof collision_table[transaction_id] !== 'undefined' && collision_table[transaction_id] > 0)
							{
								account_identifier += "<i title='Due to a naming collision the account number has been extended by " + collision_table[transaction_id] + " digits.'>." + account_hash.substring(0, collision_table[transaction_id]) + "</i><i title='The remaining numbers are also part of the account but is not needed to uniquely identify the account.'>" + account_hash.substring( collision_table[transaction_id]) + "</i></a></td>";
							}
							else
							{
								account_identifier += "<i></i><i title='These number are part of the account but is not needed to uniquely identify the account.'>." + account_hash.substring( collision_table[transaction_id]) + "</i></a></td>";
							}

							// Calculate the address:
							/*
							let temp = cashaddr.decode('bitcoincash:qr4aadjrpu73d2wxwkxkcrt6gqxgu6a7usxfm96fst');
							console.log(temp);
							console.log('decode_hash: ' + Uint8ArraytoHexString(temp.hash));
							console.log('payment_data: ' + payment_data);
							console.log(cashaddr.encode('bitcoincash', 'P2PKH', Uint8ArrayfromHexString(payment_data)));
							*/

							let payment_type = '<i>Unknown payment type</i>';
							let payment_data = 'Unknown';
							let account_address_type = 'Unknown';
							let account_address = '';

							if(parseInt(results[transaction_types[type]][index]['data'].substring(0,2)) !== 0 && parseInt(results[transaction_types[type]][index]['data'].substring(0,2)) <= 4)
							{
								payment_type = payment_types[results[transaction_types[type]][index]['data'].substring(0,2)];
								payment_data = results[transaction_types[type]][index]['data'].substring(2);

								account_address_type = payment_data_types[results[transaction_types[type]][index]['data'].substring(0,2)];
								account_address = cashaddr.encode('bitcoincash', account_address_type, Uint8ArrayfromHexString(payment_data)).substring(12);
							}

							document.getElementById('result_list').innerHTML += "<li id='" + transaction_id + "'><span class='account_identifier'>" + account_identifier + "</span><span class='emoji' title='" + unicode_emoji_names[String.fromCodePoint(account_emoji)] + "'>&#" + account_emoji + ";</span><span class='account_payment_link'><a href='https://blockchair.com/bitcoin-cash/address/" + account_address + "'>	" + account_address + "</a></span>";

							setTimeout
							(
								function()
								{
									if(account_address)
									{
										$('#' + transaction_id).qrcode(account_address);
									}
									else
									{
										document.getElementById(transaction_id).innerHTML += "<p>Unable to parse payment information</p>";
									}
								}, 100
							);
						}
					}
				}
			}
		);
	}
}

// Make a default lookup for the latest registered accounts.
window.addEventListener
(
	"load", 
	function()
	{
		lookup_identifier();
	}
);
