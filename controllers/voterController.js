const {Voter,Election} = require('../models')
const bcrypt = require('bcrypt')

exports.addVoters= async(req,res)=>{
    const {voter_Id,password} = req.body
    const electionId = req.params.id
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log(req.params)
    try {
        const voter = await Voter.addVoter({
            electionId,
            voter_Id,
            password:hashedPassword
        })
        if(!voter){
            res.status(401).json({status:'fail',message:'Unable to add voter'})
        }
        console.log(voter)
        return res.redirect(`/elections/${electionId}/voters`)
    } catch (error) {
        res.status(501).json({status:'fail',message:error.message})

    }
}
exports.getVoters = async(req,res)=>{
const electionId = req.params.id
    const voters = await Voter.getVoters(electionId)
    const adminId = req.user.id
    const election = await Election.getElectionDetails(adminId,electionId)
  if (req.accepts("html")) {
    res.render("displayVoters", {
     voters,
     election,
     title:'Online Voting Platform',
      csrfToken: req.csrfToken(),
    });
  } else {
    res.json({
      voters
    });
  }
}