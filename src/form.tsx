import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import styled from 'styled-components';
import axios from 'axios';

// Styled components
const FormContainer = styled.div`
  width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fff;
`;

const Title = styled.h1`
  text-align: center;
`;

const InputGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  font-size: 14px;
  display: block;
  margin-bottom: 5px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const RadioGroup = styled.div`
  margin: 10px 0;
`;

const RadioLabel = styled.label`
  font-size: 14px;
  margin-right: 20px;
`;

const Button = styled.button`
  width: 100%;
  padding: 10px;
  font-size: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const ErrorMessage = styled.p`
  color: red;
  font-size: 12px;
  margin-top: 5px;
`;

const IframeContainer = styled.div`
  margin-top: 20px;
  text-align: center;
`;

const StyledIframe = styled.iframe`
  width: 100%;
  height: 500px;
  border: none;
`;

interface IFormInput {
  amount: number;
  currency: string;
  paymentMethod: 'Payform' | 'S2S';
  cardNumber: string;
  cardholderName: string;
  expirationDate: string;
  securityCode: string;
}

// Yup validation schema
const validationSchema = Yup.object({
  amount: Yup.number()
    .required('Amount is required')
    .positive('Amount must be a positive number')
    .typeError('Amount must be a number'),
  currency: Yup.string().required('Currency is required'),
  paymentMethod: Yup.string()
  .oneOf(['Payform', 'S2S'], 'Invalid payment method')
  .required('Payment method is required'),
  cardNumber: Yup.string()
  .nullable()
  .when('paymentMethod', (paymentMethod: any, schema: any) =>
    paymentMethod == 'S2S'
      ? schema.required('Card number is required').matches(/^\d{16}$/, 'Card number must be 16 digits')
      : schema.notRequired()
  ),
  cardholderName: Yup.string()
    .nullable()
    .when('paymentMethod', (paymentMethod: any, schema) =>
      paymentMethod === 'S2S' ? schema.required('Cardholder name is required') : schema.notRequired()
    ),
  expirationDate: Yup.string()
    .nullable()
    .when('paymentMethod', (paymentMethod: any, schema) =>
      paymentMethod === 'S2S'
        ? schema
            .required('Expiration date is required')
            .matches(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiration date must be in MM/YY format')
        : schema.notRequired()
    ),
  securityCode: Yup.string()
    .nullable()
    .when('paymentMethod', (paymentMethod: any, schema) =>
      paymentMethod === 'S2S'
        ? schema.required('Security code is required').matches(/^\d{3}$/, 'Security code must be 3 digits')
        : schema.notRequired()
    ),
});


const PaymentForm: React.FC = () => {
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<IFormInput>({
    resolver: yupResolver(validationSchema) as any,
  });

  const paymentMethod = watch('paymentMethod');

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      if (!apiUrl) {
        throw new Error('API URL is not defined');
      }

      const response = await axios.post(`${apiUrl}/pay`, data);
      console.log("response----",response.data)
      const checkoutUrl = response.data.data.checkout_url;
      setCheckoutUrl(checkoutUrl);
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  return (
    <FormContainer>
      <Title>Payment Form</Title>
      <form onSubmit={handleSubmit(onSubmit)}>
        <InputGroup>
          <Label>Amount</Label>
          <Input type="number" {...register('amount')} />
          {errors.amount && <ErrorMessage>{errors.amount.message}</ErrorMessage>}
        </InputGroup>
        <InputGroup>
          <Label>Currency</Label>
          <Input type="text" defaultValue="EUR" {...register('currency')} />
          {errors.currency && <ErrorMessage>{errors.currency.message}</ErrorMessage>}
        </InputGroup>
        <RadioGroup>
          <RadioLabel>
            <input type="radio" value="Payform" {...register('paymentMethod')} defaultChecked />
            Payform
          </RadioLabel>
          <RadioLabel>
            <input type="radio" value="S2S" {...register('paymentMethod')}  />
            S2S
          </RadioLabel>
          {errors.paymentMethod && <ErrorMessage>{errors.paymentMethod.message}</ErrorMessage>}
        </RadioGroup>
        {paymentMethod === 'S2S' && (
          <>
            <InputGroup>
              <Label>Card Number</Label>
              <Input type="text" {...register('cardNumber')} />
              {errors.cardNumber && <ErrorMessage>{errors.cardNumber.message}</ErrorMessage>}
            </InputGroup>
            <InputGroup>
              <Label>Cardholder Name</Label>
              <Input type="text" {...register('cardholderName')} />
              {errors.cardholderName && <ErrorMessage>{errors.cardholderName.message}</ErrorMessage>}
            </InputGroup>
            <InputGroup>
              <Label>Expiration Date</Label>
              <Input type="text" placeholder="MM/YY" {...register('expirationDate')} />
              {errors.expirationDate && <ErrorMessage>{errors.expirationDate.message}</ErrorMessage>}
            </InputGroup>
            <InputGroup>
              <Label>Security Code</Label>
              <Input type="text" {...register('securityCode')} />
              {errors.securityCode && <ErrorMessage>{errors.securityCode.message}</ErrorMessage>}
            </InputGroup>
          </>
        )}
        <Button type="submit">Pay</Button>
      </form>
      {checkoutUrl ? (
        <IframeContainer>
          <StyledIframe
            src={checkoutUrl}
            title="Checkout"
            onLoad={(e) => {
              const iframe = e.target as HTMLIFrameElement;
              try {
                // Check if iframe content can be accessed (detect cross-origin restrictions)
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (!iframeDoc) {
                  throw new Error('Iframe loading error or cross-origin restriction.');
                }
              } catch (error) {
                console.error('Iframe embedding failed:', error);
                setCheckoutUrl(null); // Hide iframe
                window.open(checkoutUrl, '_blank'); // Fallback to opening in a new tab
              }
            }}
            onError={() => {
              console.error('Iframe failed to load.');
              setCheckoutUrl(null); // Hide iframe
              window.open(checkoutUrl, '_blank'); // Fallback to opening in a new tab
            }}
          />
        </IframeContainer>
      ) : (
        <ErrorMessage></ErrorMessage>
      )}


    </FormContainer>
  );
};

export default PaymentForm;
