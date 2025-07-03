const {MongoClient, ObjectId}=require("mongodb");
const { update } = require("./Idea");

const uri="mongodb://localhost:27017";
const dbName="freelance_platform";
const client=new MongoClient(uri);

const db=client.connect(db);

class Payment{
    static collectionName="payments";

    constructor({gigId,orderId, amount, transactionType,buyerId,sellerId, type,status}){
        this.gigId=gigId;
        this.orderId=orderId;
        this.amount=amount;
        this.transactionType=transactionType;
        this.buyerId=buyerId;
        this.sellerId=sellerId;
        this.type=type;
        this.status=status;

    }

    static async createpayment(data){
        const collection=db.collection(this.collectionName);
        const result =await collection.insertOne(data);
        return result.insertedId;
    }
    static async getPaymentsUser(userId, role){
        const collection=db.collection(this.collectionName);
        const query=
        role=="Buyer"
        ?{buyerId:userId}
        :{sellerId:userId};
        const result=await collection.find(query).toArray();
        return result;
    }
    static async getPaymentById(paymentId){
       const collection=db.collection(this.collectionName);
       return await collection.findOne({_id:new ObjectId(paymentId)});
    }
    static async getPaymentByOrder(orderId){
        const collection=db.collection(this.collectionName);
        return await collection.findOne({orderId}).toArray();
     }
     static async getPayments(filters={}){
        const collection=db.collection(this.collectionName);
        return await collection.findOne(filters).toArray();
     }
     static async updatePayment(paymentId, status){
        const collection=db.collection(this.collectionName);
        const result= await collection.updateOne({_Id:new ObjectId(paymentId)},
    {$set:{
        status, updatedAt:new Date()
    }})
    return result.matchedCount>0;
     }
}