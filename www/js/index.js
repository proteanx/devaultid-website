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
