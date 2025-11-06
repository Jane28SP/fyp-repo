import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  bookingId: string;
  eventId: string;
  userId: string;
}

const QRCode: React.FC<QRCodeProps> = ({ bookingId, eventId, userId }) => {
  // Create a check-in data object
  const checkInData = {
    bookingId,
    eventId,
    userId,
    timestamp: new Date().toISOString(),
  };

  // Convert the data to a JSON string
  const qrValue = JSON.stringify(checkInData);

  const displayId = useMemo(() => String(Math.floor(100000 + Math.random() * 900000)), []);

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md">
      <QRCodeSVG
        value={qrValue}
        size={200}
        level="H"
        includeMargin={true}
        className="mb-4"
      />
      <p className="text-sm text-gray-600 text-center">
        Please present this QR code at the event entrance for check-in.
      </p>
      <p className="text-xs text-gray-500 mt-2">
        Booking No.: {displayId}
      </p>
    </div>
  );
};

export default QRCode;
