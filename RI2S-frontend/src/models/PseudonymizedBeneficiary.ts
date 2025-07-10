import mongoose, { Schema, model } from 'mongoose';

const PseudonymizedBeneficiarySchema = new Schema({
    realBeneficiaryId: {
        type: Schema.Types.ObjectId,
        ref: 'RealBeneficiary',
        required: true
    },
    pseudoId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    pseudonym: {
        type: String,
        unique: true,
        required: true
    },
    cohort: String,
    inclusionDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Actif', 'Sorti', 'Suspendu'],
        default: 'Sorti'
    },

}, { timestamps: true });

// Solution pour éviter les erreurs de recompilation
if (mongoose.models && mongoose.models.PseudonymizedBeneficiary) {
    mongoose.deleteModel('PseudonymizedBeneficiary');
}

const PseudonymizedBeneficiary = model('PseudonymizedBeneficiary', PseudonymizedBeneficiarySchema);
console.log("PseudonymizedBeneficiary model loaded");
export default PseudonymizedBeneficiary;