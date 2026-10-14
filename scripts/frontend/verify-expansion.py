"""Current expanded journey: real pilots, approved public sample and supported daily reps.
Historical mock-pilot validation remains in expansion-validation; candidate mocks have been retired.
"""
import os, subprocess, sys
from pathlib import Path
scripts=Path(__file__).resolve().parent
base=os.environ.get('MIRAR_EXPANSION_PREVIEW','http://127.0.0.1:5184')
root=scripts.parents[1]/'docs/experience/pilot-integration-validation'
for name,env in [
 ('verify-pilot-integration.py',{'MIRAR_PILOT_PREVIEW':base}),
 ('verify-approved-sample.py',{'MIRAR_SAMPLE_PREVIEW':base,'MIRAR_VALIDATION_DIR':str(root/'sample')}),
 ('verify-supported-reps.py',{'MIRAR_EXPANSION_PREVIEW':base,'MIRAR_VALIDATION_DIR':str(root/'regression')})
]:
 subprocess.run([sys.executable,str(scripts/name)],env={**os.environ,**env},check=True)
