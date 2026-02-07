const mongoose = require('../exam-client-panal/exam-backend-api/node_modules/mongoose');
const { Types } = mongoose;

const uri = 'mongodb+srv://ritanshu77:ritanshu77@cluster0.ki7lbh0.mongodb.net/exam-bank?retryWrites=true&w=majority&appName=Cluster0';

async function checkDataIntegrity() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const QuestionModel = mongoose.model('Question', new mongoose.Schema({ subjectId: Types.ObjectId, unitId: Types.ObjectId }, { strict: false }));
    const UnitModel = mongoose.model('Unit', new mongoose.Schema({ subjectId: Types.ObjectId }, { strict: false }));

    const questions = await QuestionModel.find({}).limit(20).lean();
    console.log(`Checking ${questions.length} questions...`);
    
    for (const q of questions) {
      if (q.unitId) {
        console.log(`Checking Q ${q._id} with unitId ${q.unitId}`);
        const unit = await UnitModel.findById(q.unitId).lean();
        if (unit) {
          if (unit.subjectId.toString() !== q.subjectId.toString()) {
            console.log(`MISMATCH: Q ${q._id}: q.subjectId=${q.subjectId}, unit.subjectId=${unit.subjectId}`);
          } else {
            // console.log(`MATCH: Q ${q._id}`);
          }
        } else {
          console.log(`ORPHAN: Q ${q._id}: unitId ${q.unitId} not found`);
        }
      }
    }
    console.log('Check complete');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDataIntegrity();
