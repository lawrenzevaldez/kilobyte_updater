'use strict'

const moment = require("moment")

const Model = use('Model')
const Db = use('Database')

class Product extends Model {
    async getOnlineProducts() {
        try {
            let row = await Db.select('*')
                        .from('online_shop_products')
                        // .whereIn('ProductID', ['85381', '85377', '85374', '85372'])
                        // .where('ProductID', '=', 62559)
                        .where('excluded_auto', '=', 0)
                        .orderBy('ProductID', 'asc')
                        // .limit(100)
                        // .where('concessionaire', 1)
            await Db.close()
            return (row.length == 0) ? '' : row
        } catch(error) {
            console.log(error)
        }
    }

    async getStockPriceBarcode(barcode, globalid) {
        try {
            let row = await Db.connection('my179')
                        .select('A.ProductID', 'A.srp', 'A.qty', 'A.LastDateModified', 'B.SellingArea', 'A.Description')
                        .joinRaw('FROM POS_Products A INNER JOIN Products B on A.ProductID = B.ProductID')
                        .where('B.globalid', globalid)
                        .andWhere('A.Barcode', barcode)
                        .andWhere('A.PriceModeCode', 'R')
                        // .groupBy('A.srp', 'A.qty', 'A.LastDateModified', 'B.SellingArea', 'B.Description')
                        // .orderBy('A.LastDateModified', 'desc')
                        // .andWhere('UOM', 'PC')
            await Db.close()
            return (row.length == 0) ? '' : row[0]
        } catch(error) {
            console.log(error)
        }
    }

    async getStockPrice(globalid, barcode) {
        try {
            let row = await Db.connection('my179')
                        .select('A.ProductID', 'A.srp', 'A.qty', 'A.LastDateModified', 'B.SellingArea', 'B.Description')
                        .joinRaw('FROM POS_Products A INNER JOIN Products B on A.ProductID = B.ProductID')
                        .where('B.globalid', globalid)
                        .andWhere('A.Barcode', barcode)
                        .andWhere('A.PriceModeCode', 'R')
                        // .groupBy('A.ProductID', 'A.srp', 'A.qty', 'A.LastDateModified', 'B.SellingArea', 'B.Description')
                        // .orderBy('A.LastDateModified', 'desc')
                        // .andWhere('UOM', 'PC')
            await Db.close()
            return (row.length == 0) ? '' : row[0]
        } catch(error) {
            console.log(error)
        }
    }

    async updateProductDetailsOnline(sku, stocks, itemPrice, concessionaire) {
        const trx = await Db.connection('srssulit').beginTransaction()
        try {
            let data = await trx
                            .select('*')
                            .from('wp_postmeta')
                            .where('post_id', sku)
            
            for(const row of data) {
                if(row.meta_key == '_regular_price') {
                    let data = {
                        meta_value: itemPrice
                    }
                    let res = await trx
                                    .table('wp_postmeta')
                                    .update(data)
                                    .where('meta_key', '_regular_price')
                                    .andWhere('post_id', sku)
                    
                    if(!res) {
                        await trx.rollback()
                        return false
                    }

                    let res2 = await trx
                                    .table('wp_postmeta')
                                    .update(data)
                                    .where('meta_key', '_price')
                                    .andWhere('post_id', sku)
                    
                    if(!res2) {
                        await trx.rollback()
                        return false
                    }

                }

                if(row.meta_key == '_stock') {
                    let data = {
                        meta_value: parseInt(stocks)
                    }

                    let res = await trx
                                    .table('wp_postmeta')
                                    .update(data)
                                    .where('meta_key', '_stock')
                                    .andWhere('post_id', sku)
                    
                    if(!res) {
                        await trx.rollback()
                        return false
                    }
                    
                    if(parseInt(stocks) <= 0) {
                        let data = {
                            meta_value: 'outofstock'
                        }
                        let res = await trx
                                    .table('wp_postmeta')
                                    .update(data)
                                    .where('meta_key', '_stock_status')
                                    .andWhere('post_id', sku)
                        if(!res) {
                            await trx.rollback()
                            return false
                        }
                    } else {
                        let data = {
                            meta_value: 'instock'
                        }
                        let res = await trx
                                    .table('wp_postmeta')
                                    .update(data)
                                    .where('meta_key', '_stock_status')
                                    .andWhere('post_id', sku)
                        if(!res) {
                            await trx.rollback()
                            return false
                        }
                    }

                    if(concessionaire == 1) {
                        let data = {
                            meta_value: 'instock'
                        }
                        let res = await trx
                                    .table('wp_postmeta')
                                    .update(data)
                                    .where('meta_key', '_stock_status')
                                    .andWhere('post_id', sku)
                        if(!res) {
                            await trx.rollback()
                            return false
                        }
                    }
                }
            }
            await trx.commit()
            await Db.close()
            return true
        } catch (error) {
            await trx.rollback()
            console.log(error)
            await Db.close()
            return false
        }
    }

    async getCurrentlySold(GlobalID) {
        try {
            let row = await Db.connection('my179')
                            .select('current_sales')
                            .from('for_website_products_current_sales')
                            .where('ProductID', GlobalID)
            await Db.close()
            return (row.length == 0) ? '' : row[0].current_sales
        } catch (error) {
            console.log(error)
        }
    }

    async updateOnlineProducts(ProductID) {
        const trx = await Db.beginTransaction()
        try {
            let data = {
                LastDateModified: moment().format('YYYY-MM-DD hh:mm:ss')
            }
            await trx
            .table('online_shop_products')
            .update(data)
            .where('ProductID', ProductID)

            await trx.commit()
        } catch(error) {
            await trx.rollback()
            console.log(error)
        }
    }

    async save_payload(payload) {
        const trx = await Db.beginTransaction()
        try {
            let data = {
                payload: payload,
                date_added: Db.fn.now()
            }
        
            let res = await trx.insert(data).into('online_shop_products_payload')
            await trx.commit()
            return (res == 0) ? false : true
        } catch(e) {
            await trx.rollback
            console.log(e)
        }
    }

    async fetch_payload() {
        try {
            let row = await Db.select('*')
                            .from('online_shop_products_payload')
                            .where('status', 0)
            await Db.close()
            return (row.length == 0) ? '' : row
        } catch (error) {
            console.log(error)
        }
    }

    async updateProductsPayload(id) {
        const trx = await Db.beginTransaction()
        try {
            let data = {
                status: 1
            }
            await trx
            .table('online_shop_products_payload')
            .update(data)
            .where('id', id)

            await trx.commit()
        } catch(error) {
            await trx.rollback()
            console.log(error)
        }
    }
    
}

module.exports = new Product
