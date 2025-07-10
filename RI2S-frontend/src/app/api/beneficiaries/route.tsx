import { NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:5000/api/beneficiaries';

interface BeneficiaryResponse {
  pseudoId: string;
  pseudoName: string;
  status: string;
  createdAt?: string;
  cohort?: string;
  realBeneficiary?: {
    cohort?: {
      name?: string;
    };
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const requestData: Record<string, any> = {};

    // Convert FormData to object
    for (const [key, value] of formData.entries()) {
      if (key === 'caregiver' && typeof value === 'string') {
        try {
          requestData[key] = JSON.parse(value);
        } catch {
          requestData[key] = value;
        }
      } else {
        requestData[key] = value;
      }
    }

    // Validate required fields
    const requiredFields = [
      'fullName', 'firstName', 'birthDate', 'sex',
      'address', 'phone', 'status', 'recruiter',
      'cohort', 'recruitmentMethod', 'inclusionDate'
    ];
    
    const missingFields = requiredFields.filter(field => !requestData[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Champs obligatoires manquants: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['Actif', 'Sorti', 'Suspendu'];
    if (!validStatuses.includes(String(requestData.status))) {
      return NextResponse.json(
        { success: false, error: 'Statut invalide' },
        { status: 400 }
      );
    }

    // Prepare backend request
    const backendFormData = new FormData();
    Object.entries(requestData).forEach(([key, value]) => {
      if (value instanceof File) {
        backendFormData.append(key, value);
      } else if (typeof value === 'object') {
        backendFormData.append(key, JSON.stringify(value));
      } else {
        backendFormData.append(key, String(value));
      }
    });

    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      body: backendFormData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur du serveur backend');
    }

    const data: BeneficiaryResponse = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        id: data.pseudoId,
        pseudonymizedName: data.pseudoName,
        status: data.status,
        addedDate: data.createdAt || new Date().toISOString(),
        cohort: data.realBeneficiary?.cohort?.name || data.cohort || 'N/A'
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('[POST] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}