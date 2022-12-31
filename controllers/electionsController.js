const {Election} = require("../models")

//get elections
exports.getElections = async(req,res)=>{
    const loggedInUser = req.user.id
    const electionss = await Election.getElections(loggedInUser)
  if (req.accepts("html")) {
    res.render("elections", {
     electionss,
      csrfToken: req.csrfToken(),
    });
  } else {
    res.json({
      electionss
    });
  }
}
//create elections
exports.createElection = async(req,res)=>{
  
    try {
        const {title} = req.body
        const adminId = req.user.id
        const election = await Election.addElection({
            title:title,
            status:"created",
            adminId
        })
        if(!election){
            res.status(401).json({
                status:"fail",
                message:"Unable to create election"
            })
        }
        return res.redirect(`/elections/${election.id}`)
    } catch (error) {
        console.log(error.message)
        res.status(501).json({
            status:"fail",
            message:error.message
        })
    }
}