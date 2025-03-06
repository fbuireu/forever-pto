interface CreateQueryStringParams {
  value: string
  type: 'country' | 'region'
  searchParams: URLSearchParams;
}

export function createQueryString({ value, type, searchParams}: CreateQueryStringParams) {
    const params = new URLSearchParams(searchParams.toString());
    if (type === 'country') {
      params.set(type, value);
      params.delete('region');
    } else {
      params.set(type, value);
    }

    return params.toString();

}