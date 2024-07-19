export function successfulRequest (response, status, message, data) {
  return response.status(200).json({
    status,
    message,
    data
  })
}

export function failedRequest (response, status, message, error) {
  return response.status(400).json({
    status,
    message,
    error
  })
}
