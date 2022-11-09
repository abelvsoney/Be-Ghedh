var db = require('../database/connection');
var collection = require('../database/collections')

module.exports = {
    graphdata:()=>{
        return new Promise( async(resolve,reject)=>{
      

       //   WeeklySales
       var weeklySales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {$match:{status:"Delivered"}},
        {
            $project:{
             date:{$convert: { input: "$_id", to: "date" } },total:"$totalAmount"
            }
        },
       {
        $match:{
        date:{
        $lt:new Date(),$gt:new Date(new Date().getTime()-(24*60*60*1000*7))
        }
         }
       },
       {
        $group:{
           _id:{ $dayOfWeek:"$date"},
           total:{$sum:"$total"}
        }           
       },
       {
        $project:{
            date:"$_id",
            total:"$total",
            _id:0
        }
       },
       {
         $sort: {date:1}
       }
      ]).toArray()
      
        console.log(weeklySales[0]);
      
      // monthly Sales
      var monthlySales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {$match:{status:"Delivered"}},
        {
            $project:{
             date:{$convert: { input: "$_id", to: "date" } },total:"$totalAmount"
            }
        },
       {
        $match:{
        date:{
        $lt:new Date(),$gt:new Date(new Date().getTime()-(24*60*60*1000*365))
        }
         }
       },
       {
        $group:{
           _id:{ $month:"$date"},
           total:{$sum:"$total"}
        }           
       },
       {
        $project:{
            month:"$_id",
            total:"$total",
            _id:0
        }
       }
      ]).toArray()
      
      console.log(monthlySales);
      
      
      // Yearly Sales
      var yearlySales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {$match:{status:"Delivered"}},
        {
            $project:{
             date:{$convert: { input: "$_id", to: "date" } },total:"$totalAmount"
            }
        },
       
       {
        $group:{
           _id:{ $year:"$date"},
           total:{$sum:"$total"}
        }           
       },
       {
        $project:{
            year:"$_id",
            total:"$total",
            _id:0
        }
       }
      ]).toArray()
      
      console.log(yearlySales);
      resolve({weeklySales,monthlySales,yearlySales})
      
        })
      },
        //ales report
      salesReport:()=>{
       
    return new Promise( async(resolve,reject)=>{
  
    var totalUsers = await db.get().collection(collection.USER_COLLECTION).count();


        // Total Delivered Orders & today Revenue
    var TodayrevenueAndDelevered = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
            $match:{status:"Delivered"}
        },
        {
            $project:{
             date:{$convert: { input: "$_id", to: "date" } },order:1,deliveryDetails:1
            }
        },
        {
            $match:{
                date:{$lt:new Date(),$gt:new Date(new Date().getTime()-(24*60*60*1000))}
            }
        },

        { $group: {
          "_id": "tempId",
          "todayRevenue": { 
              "$sum": { "$sum": "$totalAmount" } 
          },
             "todaytotalOrders": { 
            "$sum": { "$sum": "$product.quantity" } 
             }
      } }
      ]).toArray()

    // Total Sale Price
     // Total Order Count
    var totalSale = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
      { $group: {
        "_id": "tempId",
        "totalSale": { 
            "$sum": { "$sum": "$totalAmount" } 
        },
        "totalOrders": { 
            "$sum": { "$sum": "$product.quantity" } 
        }
    } }
    ]).toArray()


     // Total Delivered Sale Price
     // Total Delivered Order Count
     var deliveredTotalSale = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
            $match:{status:"delivered"}
        },
        { $group: {
          "_id": "tempId",
          "totalRevenue": { 
              "$sum": { "$sum": "$totalAmount" } 
          },
          "totalDelivered": { 
              "$sum": { "$sum": "$product.quantity" } 
          }
      } }
      ]).toArray()

     

    // today Order Quantity todaytotalOrders
    var todayOrders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
            $project:{
             date:{$convert: { input: "$_id", to: "date" } },order:1,deliveryDetails:1
            }
        },
        {
            $match:{
                date:{$lt:new Date(),$gt:new Date(new Date().getTime()-(24*60*60*1000))}
            }
        },

        { $group: {
          "_id": "tempId",
          "todaySales": { 
              "$sum": { "$sum": "$totalAmount" } 
          },
             "todaytotalOrders": { 
            "$sum": { "$sum": "$product.quantity" } 
             }
      } }
      ]).toArray()

 
                       
   
      resolve({data:totalSale[0],totalUsers:totalUsers,todayOrders:todayOrders[0],deliveredTotalSale:deliveredTotalSale[0],TodayrevenueAndDelevered:TodayrevenueAndDelevered[0]})
})

},

findOrdersByDay:()=>{
    return new Promise (async(resolve,reject)=>{
        
        let data = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            
            {
                $match:{ date:{
                        $gte: new Date(new Date() - 60*60*24*1000*7)
                    }
                }
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    year: { $year: "$date" },
                    month: { $month: "$date" },
                    day: { $dayOfMonth: "$date" },
                    dayOfWeek: { $dayOfWeek: "$date" },
                }
            },
            {
                $group:{
                    _id:'$dayOfWeek',
                    count:{$sum:1},
                    detail:{$first:'$$ROOT'}
                }
            },
            {
                $sort:{detail:1}
            }
    ]).toArray()
        // console.log(data);
        
        resolve(data)
    })
},
findOrderByMonth:()=>{
    return new Promise (async(resolve,reject)=>{
        let data = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:{
                    date:{
                        $gte:new Date(new Date().getMonth() - 10)
                    }
                }
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    year: { $year: "$date" },
                    month: { $month: "$date" },
                    day: { $dayOfMonth: "$date" },
                    dayOfWeek: { $dayOfWeek: "$date" },
                    week: { $week: "$date" }
                }
            },
            {
                $group:{
                    _id:'$month',
                    count:{$sum:1},
                    detail:{$first:'$$ROOT'}
                }
            },
            {
                $sort:{detail:-1}
            }
        ]).toArray()
        // console.log(data);
        resolve(data)
    })
},
findOrderByYear:()=>{
    return new Promise(async (resolve, reject) => {
        let data = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match: {
                    date: {
                        $gte: new Date(new Date().getYear() - 10)
                    }
                }
            },
            {
                $unwind: '$products'
            },
            {
                $project: {
                    year: { $year: "$date" },
                    month: { $month: "$date" },
                    day: { $dayOfMonth: "$date" },
                    dayOfWeek: { $dayOfWeek: "$date" },
                    week: { $week: "$date" }
                }
            },
            {
                $group: {
                    _id: '$year',
                    count: { $sum: 1 },
                    detail: { $first: '$$ROOT' }
                }
            },
            {
                $sort: { detail: -1 }
            }
        ])
        console.log("chart:",data);
        resolve(data)
    })
},

categoryStatus:()=>{
    return new Promise(async(resolve,reject)=>{
        let data = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:{ date:{
                    $gte: new Date(new Date().getMonth()-10)
                    }
                }
            },
            {
              $lookup:  {
                from:'product',
                localField:'products.item',
                foreignField:'_id',
                as:'pro'
              },

            },
            {
                $unwind:'$pro'            
            },
            {
                $project:{
                    cat:"$pro.SubCategory"
                }
            },
            {
                $group:{
                    _id:"$cat",
                    count:{$sum:1},
                    detail:{$first:"$$ROOT"}
                }
            },
            // {

            // }


        ]).toArray()
        resolve(data)
        // console.log(data.detail.cat);
    })
}
}