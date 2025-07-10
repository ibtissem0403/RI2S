'use client'; 
import { WeakSignal } from '@/types/models'; 
import './WeakSignalDetail.css';  

interface WeakSignalDetailInfoProps {   
  signal: WeakSignal; 
}  

export default function WeakSignalDetailInfo({ signal }: WeakSignalDetailInfoProps) {   
  const formatDate = (dateStr: string) => {     
    return new Date(dateStr).toLocaleDateString('fr-FR', {       
      day: '2-digit',       
      month: '2-digit',       
      year: 'numeric'     
    });   
  };      

  return (     
    <div className="ws-detail-card">       
      <div className="ws-detail-card-header">         
        <h2 className="ws-detail-card-title">           
          <i className="fas fa-info-circle"></i>           
          Informations du signal         
        </h2>       
      </div>       
      <div className="ws-detail-card-body">         
        <div className="ws-detail-info-grid">           
          <div className="ws-detail-info-group">             
            <h3 className="ws-detail-info-title">Détails du signalement</h3>                          
            <div className="ws-detail-info-row">               
              <div className="ws-detail-info-label">Source</div>               
              <div className="ws-detail-info-value">{signal.source}</div>             
            </div>             
            <div className="ws-detail-info-row">               
              <div className="ws-detail-info-label">Date de réception</div>               
              <div className="ws-detail-info-value">{formatDate(signal.receptionDate)}</div>             
            </div>             
                      
          </div>                      
          <div className="ws-detail-info-group">             
            <h3 className="ws-detail-info-title">Informations du bénéficiaire</h3>             
            <div className="ws-detail-info-row">               
              <div className="ws-detail-info-label">Nom</div>               
              <div className="ws-detail-info-value">                 
                {signal.beneficiary.fullName} {signal.beneficiary.firstName}               
              </div>             
            </div>             
            {signal.beneficiary.birthDate && (               
              <div className="ws-detail-info-row">                 
                <div className="ws-detail-info-label">Date de naissance</div>                 
                <div className="ws-detail-info-value">                   
                  {formatDate(signal.beneficiary.birthDate)}                 
                </div>               
              </div>             
            )}           
          </div>         
        </div>                  
        <div className="ws-detail-description">           
          <h3 className="ws-detail-info-title">Description</h3>           
          <div className="ws-detail-description-content">             
            {signal.description}           
          </div>         
        </div>                  
        {signal.notes && (           
          <div className="ws-detail-notes">             
            <h3 className="ws-detail-info-title">Notes additionnelles</h3>             
            <div className="ws-detail-notes-content">               
              {signal.notes}             
            </div>           
          </div>         
        )}       
      </div>     
    </div>   
  ); 
}