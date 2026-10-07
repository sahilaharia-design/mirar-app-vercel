import React,{useState} from 'react';
import {router,useLocalSearchParams} from 'expo-router';
import {useTranslation} from 'react-i18next';
import {useAuthStore} from '../../stores/auth-store';
import {EntryExperience} from '../../components/experience/EntryExperience';
export default function LoginScreen(){
 const {t}=useTranslation();const {auth_error}=useLocalSearchParams<{auth_error?:string}>();const [email,setEmail]=useState('');const [sent,setSent]=useState(false);const [error,setError]=useState<string|null>(auth_error?t('auth.link_expired'):null);const {signInWithEmail,isLoading}=useAuthStore();
 const submit=async()=>{if(isLoading||!email.trim())return;setError(null);const result=await signInWithEmail(email.trim().toLowerCase());if(result.error)setError(result.error);else setSent(true);};
 return <EntryExperience email={email} onEmail={value=>{setEmail(value);setError(null);}} onSubmit={()=>void submit()} onBack={()=>router.replace('/')} onRetry={()=>setSent(false)} loading={isLoading} sent={sent} error={error}/>;
}
