"use client";
import { useState } from 'react';
import { CreditCard, DollarSign } from 'lucide-react';

interface PaymentFormProps {
  totalAmount: number;
  onPaymentMethodSelect: (method: string) => void;
  selectedMethod: string;
}

export function PaymentForm({ totalAmount, onPaymentMethodSelect, selectedMethod }: PaymentFormProps) {
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, description: 'Visa, Mastercard, Amex' },
    { id: 'cash', name: 'Pay at Counter', icon: DollarSign, description: 'Cash payment at cinema' },
  ];

  return (
    <div className="space-y-6">
      {/* Total Amount */}
      <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">Total Amount</p>
            <p className="text-3xl font-bold mt-1">${totalAmount.toFixed(2)}</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-red-700 flex items-center justify-center">
            <DollarSign className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div>
        <h3 className="font-medium mb-4">Select Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => onPaymentMethodSelect(method.id)}
                className={`
                  p-4 rounded-xl border-2 transition-all text-left
                  ${selectedMethod === method.id
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    p-2 rounded-lg
                    ${selectedMethod === method.id ? 'bg-red-500/20' : 'bg-zinc-900'}
                  `}>
                    <Icon className={`w-5 h-5 ${selectedMethod === method.id ? 'text-red-400' : 'text-zinc-400'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{method.name}</p>
                    <p className="text-xs text-zinc-500 mt-1">{method.description}</p>
                  </div>
                  {selectedMethod === method.id && (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-red-500 to-red-700 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Card Details Form (only show if card is selected) */}
      {selectedMethod === 'card' && (
        <div className="space-y-4 pt-4 border-t border-zinc-800">
          <h3 className="font-medium">Card Details</h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">Card Number</label>
            <input
              type="text"
              value={cardDetails.cardNumber}
              onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Cardholder Name</label>
            <input
              type="text"
              value={cardDetails.cardName}
              onChange={(e) => setCardDetails({ ...cardDetails, cardName: e.target.value })}
              placeholder="JOHN DOE"
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Expiry Date</label>
              <input
                type="text"
                value={cardDetails.expiryDate}
                onChange={(e) => setCardDetails({ ...cardDetails, expiryDate: e.target.value })}
                placeholder="MM/YY"
                maxLength={5}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">CVV</label>
              <input
                type="text"
                value={cardDetails.cvv}
                onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                placeholder="123"
                maxLength={3}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex items-start gap-2">
            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-xs text-zinc-400">
              Your payment information is encrypted and secure. We do not store your card details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
