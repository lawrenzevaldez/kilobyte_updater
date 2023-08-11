'use strict'
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
const WPAPI = require('wpapi');
const Product = require("../../Models/Product");
const ProductMod = use('App/Models/Product')
const UserMaintenanceMod = use('App/Models/UserMaintenance')

class WooCommerceApiController {

    constructor() {

        this.WPAPI = new WPAPI({
            endpoint: 'http://kilobyte.shop/wp-json',
            username: 'erickskiph320@gmail.com',
            password: '1DnK NHSA mF0x D5hV NpZG Uxiq'
        })

        this.WooCommerce = new WooCommerceRestApi({
            url: 'https://www.kilobyte.shop/',
            consumerKey: 'ck_ce0da82752a8c8c04b322ea92a02980268948774',
            consumerSecret: 'cs_7d99b15ebbe5401d955d160ab6f3e2189d81c1cf',
            version: 'wc/v3'
        })
    }

    async updateStockPrice() {
        try {
            let pageRes = await ProductMod.getOnlineProducts()
            for(let i = 0; i < pageRes.length; i++) {
                let prodDetails
                if(pageRes[i].by_barcode == 'Y' || pageRes[i].by_barcode == 'Yes' || pageRes[i].by_barcode == 'yes' || pageRes[i].by_barcode == 'y') {
                    prodDetails = await ProductMod.getStockPriceBarcode(pageRes[i].GlobalID, pageRes[i].Barcode)
                } else {
                    prodDetails = await ProductMod.getStockPrice(pageRes[i].GlobalID, pageRes[i].Barcode)
                }
                if(prodDetails == '') continue
                let itemPrice = 0
                if(pageRes[i].grams != null) {
                    itemPrice = (prodDetails.srp/1000)*parseInt(pageRes[i].grams)
                } else {
                    itemPrice = prodDetails.srp
                }
                let stocks = parseInt(prodDetails.SellingArea)
                let data

                if(pageRes[i].concessionaire == 1) {
                    data = {
                        manage_stock: false,
                        price: itemPrice.toString(),
                        regular_price: itemPrice.toString(),
                    }
                } else {
                    data = {
                        stock_quantity: stocks,
                        price: itemPrice.toString(),
                        regular_price: itemPrice.toString(),
                    }
                }
        
                await this.WooCommerce.put('products/'+pageRes[i].ProductID, data)
                await UserMaintenanceMod.audit_trail(0, 'AUTO UPDATE', 'PRODUCT', `UPDATE THE STOCK AND PRICE OF PRODUCT SKU ${pageRes[i].GlobalID} & NAME ${pageRes[i].productName.toUpperCase()}`)
                await ProductMod.updateOnlineProducts(pageRes[i].ProductID)
                console.log('UPDATING STOCK AND PRICE: ' + pageRes[i].ProductID)
            }
        } catch(Exception) {
            console.log(Exception)
        }
    }

    async updatePrice() {
        try {
            let pageRes = await ProductMod.getOnlineProducts()
            if(pageRes == '') return true
            for(let i = 0; i <= pageRes.length; i++) {
                let prodDetails
                if(pageRes[i].by_barcode == 'Y' || pageRes[i].by_barcode == 'Yes' || pageRes[i].by_barcode == 'yes' || pageRes[i].by_barcode == 'y') {
                    prodDetails = await ProductMod.getStockPriceBarcode(pageRes[i].GlobalID, pageRes[i].Barcode)
                } else {
                    prodDetails = await ProductMod.getStockPrice(pageRes[i].GlobalID, pageRes[i].Barcode)
                }
                if(prodDetails == '') continue
                let currentlySold = 0
                let itemPrice = prodDetails.srp

                let getPercentage = parseFloat(pageRes[i].percentage/100).toFixed(2)
                let getPricePercentage = parseFloat(itemPrice*getPercentage).toFixed(2)
                let fitemPrice = parseFloat(parseFloat(itemPrice)+parseFloat(getPricePercentage)).toFixed(2)
                let stocks = parseFloat(prodDetails.SellingArea - currentlySold)
                
                // // NEW METHOD FOR UPDATE OF STOCK AND PRICE
                let res = await ProductMod.updateProductDetailsOnline(pageRes[i].ProductID, stocks, fitemPrice, pageRes[i].concessionaire)
                if(res) {
                    // await UserMaintenanceMod.audit_trail(0, 'AUTO UPDATE', 'PRODUCT', `UPDATE THE STOCK AND PRICE OF PRODUCT SKU ${pageRes[i].GlobalID} & NAME ${pageRes[i].productName.toUpperCase()}`)
                    console.log('UPDATING STOCK AND PRICE: ' + pageRes[i].GlobalID)
                    await ProductMod.updateOnlineProducts(pageRes[i].ProductID)
                }
                // // ./NEW METHOD FOR UPDATE OF STOCK AND PRICE
            }
        } catch(error) {
            console.log(error)
        }
    }
}

module.exports = WooCommerceApiController