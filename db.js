const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')

let db = null

const dbConnect = async () => {
  const client = new MongoClient(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })
  await client.connect()

  db = client.db(process.env.DB_NAME)
}

const dbInsert = async (collection, payload) => {
  const insert = Array.isArray(payload) && payload.length ? 'insertMany' : 'insertOne'
  return await db.collection(collection)[insert](payload)
}

const dbFind = async (collection, payload, options) => {
  let res = await db.collection(collection).find(payload)

  if (options) {
    if (options.sort) {
      res = res.sort(options.sort)
    }
  }

  const resArr = await res.toArray()

  return resArr.length ? resArr : null
}

const dbFindByObjectId = async (collection, id) => {
  return await db.collection(collection).find({ _id: new ObjectId(id) }).toArray()
}

const dbFindOneAndUpdate = async (collection, filter, update) => {
  return await db.collection(collection).findOneAndUpdate(filter, { $set: update })
}

const dbFindOneByObjectIdAndUpdate = async (collection, id, update) => {
  return await db.collection(collection).findOneAndUpdate({ _id: new ObjectId(id) }, { $set: update })
}

const dbFindOneByObjectIdAndDelete = async (collection, id) => {
  return await db.collection(collection).findOneAndDelete({ _id: new ObjectId(id) })
}

module.exports = {
  dbConnect,
  dbInsert,
  dbFind,
  dbFindByObjectId,
  dbFindOneAndUpdate,
  dbFindOneByObjectIdAndUpdate,
  dbFindOneByObjectIdAndDelete
}