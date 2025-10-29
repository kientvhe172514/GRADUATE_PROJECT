# Script này sẽ tạo ra các pattern thay thế cho tất cả services
# Copy nội dung này vào workflow

# Leave Service
kubectl create secret generic leave-secret \
  --from-literal=.env='${{ secrets.LEAVE_SECRET }}' \
  -n graduate-project \
  --dry-run=client -o yaml | kubectl apply -f -

# Notification Service  
kubectl create secret generic notification-secret \
  --from-literal=.env='${{ secrets.NOTIFICATION_SECRET }}' \
  -n graduate-project \
  --dry-run=client -o yaml | kubectl apply -f -

# Reporting Service
kubectl create secret generic reporting-secret \
  --from-literal=.env='${{ secrets.REPORTING_SECRET }}' \
  -n graduate-project \
  --dry-run=client -o yaml | kubectl apply -f -

# Face Recognition Service
kubectl create secret generic face-recognition-secret \
  --from-literal=.env='${{ secrets.FACE_RECOGNITION_SECRET }}' \
  -n graduate-project \
  --dry-run=client -o yaml | kubectl apply -f -
