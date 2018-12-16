const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const rpc = require('node-bitcoin-rpc');
const bch = require('bitcore-lib-cash');
const cashaddr = require('cashaddrjs');
const bchaddr = require('bchaddrjs');

mongoose.connect(process.env.MONGO_CONNECTION, { useNewUrlParser: true });
const Alias = require('../models/alias');

/**
 * @api {post} /alias Create alias
 * @apiName Create new alias
 * 
 * @apiParam {String} [requested_alias] The requested alias
 * @apiParam {String} [payment_data] A bitcoin cash address
 * 
 * @apiSuccess (200) {Object} `Alias` object
 */
router.post('/', async function (req, res) {
    const { requested_alias, payment_data } = req.body;
    if (!requested_alias || !/^\w{1,99}$/.test(requested_alias)) {
        return res.status(400).json({ err: 'invalid-alias' })
    }

    const pd = id_payment_data(payment_data);
    if (!pd) return res.status(400).json({ err: 'unrecognized-payment-data' })
    console.log(pd);

    const alias = await Alias.create({
        alias: requested_alias,
        payment_data: { [pd.type]: pd.hash }
    });

    const s = s2h(build_script(alias));

    return res.status(200).json({ alias: alias, script: s });
});

/**
 * @api {post} /alias/:id/broadcast Broadcast alias
 * @apiName Broadcast alias
 * 
 * @apiParam {ObjectId} [id] _id property of alias returned from POST /alias
 */
router.post('/:id/broadcast', async function (req, res) {
    const alias_id = req.params['id'];
    console.log(alias_id);

    const alias = await Alias.findById(alias_id);

    rpc.init(process.env.ABC_RPC_ADDR, 8333, process.env.ABC_RPC_USER, process.env.ABC_RPC_PASS);

    rpc.call('listunspent', [0], (err, r) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ err: err });
        }

        const utxos = r.result;

        const s = build_script(alias);

        let tx = new bch.Transaction().from(utxos).feePerKb(1001);
        tx.addOutput(new bch.Transaction.Output({ script: s, satoshis: 0 }));

        rpc.call('getrawchangeaddress', [], (err, r) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ err: err });
            }

            tx.change(r.result);

            rpc.call('signrawtransaction', [tx.toString()], (err, r) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ err: err });
                }

                console.log(r);

                rpc.call('sendrawtransaction', [r.result.hex], (err, r) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ err: err });
                    }

                    return res.status(200).json({ txid: r.result });
                })
            })
        });
    });
});

function build_script(alias) {
    data_map = {
        'p2pkh': '01',
        'p2sh' : '02',
        'p2pc' : '03',
        'p2sk' : '04',
    }

    const s = new bch.Script();
    s.add(bch.Opcode.OP_RETURN);
    s.add(Buffer.from("01010101", "hex"));
    s.add(Buffer.from(alias.alias, "utf8"));

    for (let [key, value] of alias.payment_data.entries()) {
        s.add(Buffer.from(data_map[key] + value, "hex"));
    }

    console.log(s);
    return s;
}

function s2h(script) {
    let parts = script.toString().replace("OP_RETURN", '0x6a').split(' ');
    let string = "";
    for (let p of parts) {
        if (p.indexOf('0x') === 0) {
            string += p.substring(2);
        } else {
            let hc = (p).toString(16);
            if (hc.length % 2) hc = '0' + hc;
            string += hc;
        }
    }

    return string;
}

function id_payment_data(pd) {
    pd = pd.toLowerCase();
    try {
        const type = bchaddr.detectAddressType(pd)
        return {
            type: type,
            hash: Buffer.from(cashaddr.decode(bchaddr.toCashAddress(pd)).hash).toString('hex')
        }
    } catch (err) { }

    // failed to detect an address
    return false;
}

module.exports = router;