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

  return await res.toArray()
}

const dbFindByKey = async (collection, key) => {
  return await db.collection(collection).find({[key]: {$exists: true}}).toArray()
}

const dbFindByObjectId = async (collection, id) => {
  return await db.collection(collection).find({ _id: new ObjectId(id) }).toArray()
}

const dbFindOneAndUpdate = async (collection, filter, update) => {
  return await db.collection(collection).findOneAndUpdate(filter, update, { upsert: true })
}

const dbFindByIdFirstInArrayAndUpdate = async (collection, id, { keyToFind, valueToFind }, { keyToUpdate, valueToUpdate }) => {
  return await db.collection(collection).updateOne(
    { _id: new ObjectId(id), [keyToFind]: valueToFind },
    { $set: { [keyToUpdate]: valueToUpdate } }
  )
}

const dbFindOneByObjectIdAndUpdate = async (collection, id, update) => {
  return await db.collection(collection).findOneAndUpdate({ _id: new ObjectId(id) }, { $set: update })
}

const dbFindOneByObjectIdAndDelete = async (collection, id) => {
  return await db.collection(collection).findOneAndDelete({ _id: new ObjectId(id) })
}

const dbFindManyAndRemoveField = async (collection, search, field) => {
  return await db.collection(collection).updateMany(search, { $unset: { [field]: '' }})
}

const dbUpdateOne = async (collection, payload) => {
  return await db.collection(collection).dbUpdateOne(search, { $unset: { [field]: '' }})
}

module.exports = {
  dbConnect,
  dbInsert,
  dbFind,
  dbFindByKey,
  dbFindByObjectId,
  dbFindOneAndUpdate,
  dbFindByIdFirstInArrayAndUpdate,
  dbFindOneByObjectIdAndUpdate,
  dbFindOneByObjectIdAndDelete,
  dbFindManyAndRemoveField
}