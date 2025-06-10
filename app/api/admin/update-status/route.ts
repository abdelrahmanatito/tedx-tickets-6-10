function generateProfessionalTicketHtml({
  name,
  ticketId,
  email,
  university,
  date,
  time,
  venue,
  seat,
}: {
  name: string
  ticketId: string
  email: string
  university: string
  date: string
  time: string
  venue: string
  seat: string
}) {
  // Create an inline SVG for the TEDx logo
  const tedxLogoSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="40" viewBox="0 0 60 40" fill="none">
      <rect width="60" height="40" fill="white"/>
      <text x="0" y="24" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#dc2626">TED</text>
      <text x="30" y="24" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#000000">x</text>
      <text x="38" y="24" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#f5c842">ECU</text>
    </svg>
  `

  // Base64 encode the SVG for use in an img tag
  const tedxLogoBase64 = Buffer.from(tedxLogoSvg).toString("base64")

  return `
    <div style="
      width: 900px;
      height: 500px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
      position: relative;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #ffffff;
      overflow: hidden;
      border-radius: 20px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
      border: 1px solid #334155;
    ">
      <!-- Geometric background pattern -->
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: 
          radial-gradient(circle at 20% 80%, rgba(239, 68, 68, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.1) 0%, transparent 50%),
          linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.02) 50%, transparent 70%);
        opacity: 0.8;
      "></div>
      
      <!-- Header Section -->
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 120px;
        background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
        display: flex;
        align-items: center;
        padding: 0 40px;
        box-sizing: border-box;
      ">
        <!-- TEDx Logo -->
        <div style="
          display: flex;
          align-items: center;
          gap: 20px;
        ">
          <div style="
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
          ">
            <img src="data:image/svg+xml;base64,${tedxLogoBase64}" 
                 style="width: 60px; height: 40px;" 
                 alt="TEDx Logo" />
          </div>
          <div>
            <div style="
              font-size: 42px;
              font-weight: 900;
              color: white;
              letter-spacing: -1px;
              margin-bottom: -5px;
            ">TED<span style="color: white;">x</span><span style="color: #fbbf24;">ECU</span></div>
            <div style="
              font-size: 14px;
              color: rgba(255, 255, 255, 0.9);
              font-weight: 500;
              letter-spacing: 1px;
            ">x = independently organized TED event</div>
          </div>
        </div>
        
        <!-- Event Theme -->
        <div style="
          margin-left: auto;
          text-align: right;
        ">
          <div style="
            font-size: 18px;
            color: white;
            font-weight: 600;
            margin-bottom: 5px;
          ">2025</div>
          <div style="
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            font-style: italic;
          ">Ideas Worth Spreading</div>
        </div>
      </div>
      
      <!-- Main Content Area -->
      <div style="
        position: absolute;
        top: 140px;
        left: 40px;
        right: 40px;
        bottom: 40px;
        display: flex;
        gap: 40px;
      ">
        <!-- Left Section - Attendee Info -->
        <div style="
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 30px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        ">
          <div style="
            font-size: 16px;
            color: #ef4444;
            font-weight: 600;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
          ">Attendee Information</div>
          
          <div style="margin-bottom: 20px;">
            <div style="
              font-size: 12px;
              color: #94a3b8;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">Full Name</div>
            <div style="
              font-size: 24px;
              color: #ffffff;
              font-weight: 700;
              line-height: 1.2;
            ">${name}</div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <div style="
              font-size: 12px;
              color: #94a3b8;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">University</div>
            <div style="
              font-size: 16px;
              color: #e2e8f0;
              font-weight: 500;
            ">${university}</div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <div style="
              font-size: 12px;
              color: #94a3b8;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">Email</div>
            <div style="
              font-size: 14px;
              color: #cbd5e1;
              font-weight: 400;
            ">${email}</div>
          </div>
          
          <!-- Ticket ID Highlight -->
          <div style="
            background: linear-gradient(135deg, #ef4444, #dc2626);
            border-radius: 12px;
            padding: 15px;
            margin-top: 20px;
          ">
            <div style="
              font-size: 12px;
              color: rgba(255, 255, 255, 0.8);
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">Ticket ID</div>
            <div style="
              font-size: 28px;
              color: white;
              font-weight: 900;
              font-family: 'Courier New', monospace;
              letter-spacing: 2px;
            ">${ticketId}</div>
          </div>
        </div>
        
        <!-- Right Section - Event Details -->
        <div style="
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        ">
          <!-- Event Details -->
          <div style="
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            flex: 1;
          ">
            <div style="
              font-size: 16px;
              color: #ef4444;
              font-weight: 600;
              margin-bottom: 20px;
              text-transform: uppercase;
              letter-spacing: 1px;
            ">Event Details</div>
            
            <div style="display: flex; flex-direction: column; gap: 15px;">
              <div>
                <div style="
                  font-size: 12px;
                  color: #94a3b8;
                  margin-bottom: 5px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                ">Date</div>
                <div style="
                  font-size: 18px;
                  color: #ffffff;
                  font-weight: 600;
                ">${date}</div>
              </div>
              
              <div>
                <div style="
                  font-size: 12px;
                  color: #94a3b8;
                  margin-bottom: 5px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                ">Time</div>
                <div style="
                  font-size: 18px;
                  color: #ffffff;
                  font-weight: 600;
                ">${time}</div>
              </div>
              
              <div>
                <div style="
                  font-size: 12px;
                  color: #94a3b8;
                  margin-bottom: 5px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                ">Venue</div>
                <div style="
                  font-size: 16px;
                  color: #e2e8f0;
                  font-weight: 500;
                  line-height: 1.3;
                ">${venue}</div>
              </div>
              
              <div>
                <div style="
                  font-size: 12px;
                  color: #94a3b8;
                  margin-bottom: 5px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                ">Admission</div>
                <div style="
                  font-size: 16px;
                  color: #e2e8f0;
                  font-weight: 500;
                ">${seat}</div>
              </div>
            </div>
          </div>
          
          <!-- QR Code Section -->
          <div style="
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            padding: 20px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
          ">
            <div style="
              font-size: 12px;
              color: #374151;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-weight: 600;
            ">Scan for Entry</div>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(ticketId)}&bgcolor=ffffff&color=000000" 
                 style="width: 120px; height: 120px; border-radius: 8px;" 
                 alt="QR Code" />
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="
        position: absolute;
        bottom: 10px;
        left: 40px;
        right: 40px;
        text-align: center;
        font-size: 11px;
        color: #64748b;
        font-weight: 500;
      ">
        This ticket is valid for one person only • Present this ticket and a valid ID at the venue
      </div>
    </div>
  `
}
