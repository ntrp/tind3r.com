const getExtId = () => (
  localStorage.getItem('ext_id') || 'iopleohdgiomebidpblllpaigodfhoia'
)

export const EXT_ID = getExtId();
