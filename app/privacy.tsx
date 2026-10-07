import {router} from 'expo-router';
import {PrivacyExperience} from '../components/experience/PrivacyExperience';
export default function Privacy(){return <PrivacyExperience onBack={()=>router.canGoBack()?router.back():router.replace('/')}/>;}
