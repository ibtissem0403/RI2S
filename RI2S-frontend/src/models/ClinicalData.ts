import mongoose, { Schema, model, Model } from 'mongoose';

interface IClinicalData {
    realBeneficiary: mongoose.Types.ObjectId;
    fileName: string;
    fileType: string;
    content: string;
    uploadedAt: Date;
}

const clinicalDataSchema = new Schema<IClinicalData>({
    realBeneficiary: {
        type: Schema.Types.ObjectId,
        ref: 'RealBeneficiary',
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

// Proper model registration pattern
const ClinicalData: Model<IClinicalData> = 
    mongoose.models.ClinicalData || model<IClinicalData>('ClinicalData', clinicalDataSchema);

console.log("ClinicalData model loaded");
export default ClinicalData;