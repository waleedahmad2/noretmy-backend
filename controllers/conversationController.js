const Conversation = require("../models/Conversation");

const createConverstion = async (req, res,next) => {
    // Implementation
    const newConversation= new Conversation({
      id: req.isSeller ? req.userId + req.body.to : req.body.to+req.userId,
      sellerId: req.isSeller ? req.userId :req.body.to,
      buyerId :req.isSeller ? re  .body.to :req.userId,
      readBySeller:req.isSeller,
      readByBuyer: !req.isSeller,

    })
    try {
      const savedConversation= await newConversation.save();

      res.status(201).send(savedConversation);
      
    } catch (error) {
      next(error)
    }
  };
  
  const getConverstion = async (req, res,next) => {
    // Implementation

    try {
      const conversation=  await Conversation.find({id:req.params.id});

      if(!conversation) res.status(404).send("No conversation available");
      res.status(200).send(conversation);      
    } catch (error) {
      next(error)
    }
  };
  
  const getConverstions =async  (req, res,next) => {
    // Implementation
try {
  const conversations= await Conversation.find(req.isSeller? {sellerId: req.userId} : {buyerId:req.userId});
  res.status(200).send(conversations);
} catch (error) {
  next(error);
  
}

  };
  
  const updateConverstion = async (req, res,next) => {
    console.log(req.params.id);
    // Implementation
    try {
      const updatedConveration= await Conversation.findOneAndUpdate({id:req.params.id},{
        $set:{
          // readBySeller: true,
          // readByBuyer: true,
          ...(req.isSeller? {readBySeller:true} :{readByBuyer:true})
        },
      },
      { new:true}
    );

    res.status(200).send(updatedConveration);

    } catch (error) {
      
    }
  };
  
  module.exports = {
    createConverstion,
    getConverstion,
    getConverstions,
    updateConverstion
  };
  