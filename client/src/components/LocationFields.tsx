import { useTranslation } from 'react-i18next'
import Select from 'react-select'
import AsyncSelect from 'react-select/async'
import isoCountries from 'i18n-iso-countries'
import englishCountries from 'i18n-iso-countries/langs/en.json'
import { apiClient } from '@/lib/api'

isoCountries.registerLocale(englishCountries)

const getDisplayCity = (city: string) => city.split('|', 1)[0].replace(/^,\s*/, '').trim()

const countryOptions = Object.entries(isoCountries.getNames('en'))
  .map(([code, name]) => ({ code, value: name, label: name }))
  .sort((first, second) => first.label.localeCompare(second.label))

interface LocationFieldsProps {
  city: string
  country: string
  province?: string
  showProvince?: boolean
  requiredCountry?: boolean
  onChange: (city: string, country: string, province?: string) => void
}

interface CityOption {
  city: string
  province: string
  country: string
  value: string
  label: string
}

export default function LocationFields({
  city,
  country,
  province = '',
  showProvince = false,
  requiredCountry = false,
  onChange,
}: LocationFieldsProps) {
  const { t } = useTranslation()
  const selectedCountry = countryOptions.find((option) => option.value === country || option.code === country)
    || (country ? { code: '', value: country, label: country } : null)
  const citySearchCountry = selectedCountry?.value || ''
  const cityValue: CityOption | null = city
    ? { city, province: '', country, value: `${city}|${country}`, label: getDisplayCity(city) }
    : null
  const provinceValue = province ? { value: province, label: province } : null

  const loadCityOptions = async (input: string): Promise<CityOption[]> => {
    const search = input.trim()
    if (search.length < 2) return []

    try {
      const data = await apiClient.searchCities(search, citySearchCountry) as any
      return (Array.isArray(data?.cities) ? data.cities : []).map((record: Omit<CityOption, 'value' | 'label'>) => {
        const displayCity = getDisplayCity(record.city)
        const province = record.province?.trim().toLocaleLowerCase() === displayCity.toLocaleLowerCase() ? '' : record.province
        return {
          ...record,
          value: `${record.city}|${record.province}|${record.country}`,
          label: [displayCity, province, citySearchCountry ? '' : record.country].filter(Boolean).join(', '),
        }
      })
    } catch {
      return []
    }
  }

  const selectCity = (option: CityOption | null) => {
    if (!option) {
      onChange('', citySearchCountry, province)
      return
    }
    const countryCode = isoCountries.getAlpha2Code(option.country, 'en')
    const canonicalCountry = countryCode ? isoCountries.getName(countryCode, 'en') : undefined
    onChange(option.city, canonicalCountry || option.country, option.province)
  }

  const loadProvinceOptions = async (input: string) => {
    const search = input.trim()
    if (!country || search.length < 2) return []

    try {
      const data = await apiClient.searchProvinces(search, citySearchCountry) as any
      return (Array.isArray(data?.provinces) ? data.provinces : []).map((name: string) => ({
        value: name,
        label: name,
      }))
    } catch {
      return []
    }
  }

  return (
    <div className={`grid grid-cols-1 gap-6 ${showProvince ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {t('admin.people.city', 'City')}
        <AsyncSelect
          key={`city-${citySearchCountry || 'worldwide'}`}
          inputId="person-city-search"
          instanceId="person-city-search"
          aria-label={t('admin.people.city', 'City')}
          value={cityValue}
          loadOptions={loadCityOptions}
          onChange={selectCity}
          getOptionValue={(option) => option.value}
          getOptionLabel={(option) => option.label}
          isClearable
          defaultOptions={false}
          cacheOptions
          loadingMessage={() => t('common.loading', 'Loading...')}
          noOptionsMessage={({ inputValue }) => inputValue.trim().length < 2
            ? t('admin.people.typeToSearchCities', 'Type at least 2 characters')
            : t('admin.people.noCitiesFound', 'No cities found')}
          placeholder={citySearchCountry
            ? t('admin.people.searchCityInCountry', 'Search for cities in {{country}}...', { country: citySearchCountry })
            : t('admin.people.searchCity', 'Search for cities worldwide...')}
          unstyled
          className="mt-1"
          classNames={{
            control: (state) => `min-h-[42px] w-full rounded-lg border !bg-white px-3 py-2 dark:!bg-gray-800 ${state.isFocused ? 'border-transparent ring-2 ring-blue-500' : 'border-gray-300 dark:border-gray-600'}`,
            valueContainer: () => 'gap-1 p-0',
            input: () => 'text-gray-900 dark:text-gray-100',
            singleValue: () => 'text-gray-900 dark:text-gray-100',
            placeholder: () => 'text-gray-400 dark:text-gray-500',
            indicatorsContainer: () => 'gap-1 pr-2 text-gray-400',
            menu: () => 'z-30 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800',
            menuList: () => 'max-h-60 overflow-y-auto',
            option: (state) => `cursor-pointer px-3 py-2 text-sm text-gray-900 dark:text-gray-100 ${state.isFocused ? 'bg-blue-50 dark:bg-gray-700' : ''}`,
            noOptionsMessage: () => 'px-3 py-2 text-sm text-gray-500 dark:text-gray-400',
          }}
        />
      </label>
      {showProvince && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('adminForms.roasters.state', 'State / Province')}
          <AsyncSelect
            key={`province-${citySearchCountry || 'no-country'}`}
            inputId="location-province-search"
            instanceId="location-province-search"
            aria-label={t('adminForms.roasters.state', 'State / Province')}
            value={provinceValue}
            loadOptions={loadProvinceOptions}
            onChange={(option) => onChange(city, citySearchCountry, option?.value || '')}
            getOptionValue={(option) => option.value}
            getOptionLabel={(option) => option.label}
            isClearable
            defaultOptions={false}
            cacheOptions
            loadingMessage={() => t('common.loading', 'Loading...')}
            noOptionsMessage={({ inputValue }) => !citySearchCountry
              ? t('admin.people.selectCountryForProvinces', 'Select a country to search provinces')
              : inputValue.trim().length < 2
                ? t('admin.people.typeToSearchProvinces', 'Type at least 2 characters')
                : t('admin.people.noProvincesFound', 'No provinces found')}
            placeholder={citySearchCountry
              ? t('admin.people.searchProvinceInCountry', 'Search provinces/states in {{country}}...', { country: citySearchCountry })
              : t('admin.people.selectCountryForProvinces', 'Select a country to search provinces')}
            isDisabled={!citySearchCountry}
            unstyled
            className="mt-1"
            classNames={{
              control: (state) => `min-h-[42px] w-full rounded-lg border !bg-white px-3 py-2 dark:!bg-gray-800 ${state.isFocused ? 'border-transparent ring-2 ring-blue-500' : 'border-gray-300 dark:border-gray-600'}`,
              valueContainer: () => 'gap-1 p-0',
              input: () => 'text-gray-900 dark:text-gray-100',
              singleValue: () => 'text-gray-900 dark:text-gray-100',
              placeholder: () => 'text-gray-400 dark:text-gray-500',
              indicatorsContainer: () => 'gap-1 pr-2 text-gray-400',
              menu: () => 'z-30 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800',
              menuList: () => 'max-h-60 overflow-y-auto',
              option: (state) => `cursor-pointer px-3 py-2 text-sm text-gray-900 dark:text-gray-100 ${state.isFocused ? 'bg-blue-50 dark:bg-gray-700' : ''}`,
              noOptionsMessage: () => 'px-3 py-2 text-sm text-gray-500 dark:text-gray-400',
            }}
          />
        </label>
      )}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {t('admin.people.country', 'Country')} {requiredCountry && <span className="text-red-500">*</span>}
        <Select
          inputId="person-country-search"
          instanceId="person-country-search"
          aria-label={t('admin.people.country', 'Country')}
          options={countryOptions}
          value={selectedCountry}
          onChange={(option) => onChange('', option?.value || '', '')}
          isClearable
          placeholder={t('admin.people.searchCountry', 'Search countries...')}
          noOptionsMessage={() => t('admin.people.noCountriesFound', 'No countries found')}
          unstyled
          className="mt-1"
          classNames={{
            control: (state) => `min-h-[42px] w-full rounded-lg border !bg-white px-3 py-2 dark:!bg-gray-800 ${state.isFocused ? 'border-transparent ring-2 ring-blue-500' : 'border-gray-300 dark:border-gray-600'}`,
            valueContainer: () => 'gap-1 p-0',
            input: () => 'text-gray-900 dark:text-gray-100',
            singleValue: () => 'text-gray-900 dark:text-gray-100',
            placeholder: () => 'text-gray-400 dark:text-gray-500',
            indicatorsContainer: () => 'gap-1 pr-2 text-gray-400',
            menu: () => 'z-30 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800',
            menuList: () => 'max-h-60 overflow-y-auto',
            option: (state) => `cursor-pointer px-3 py-2 text-sm text-gray-900 dark:text-gray-100 ${state.isFocused ? 'bg-blue-50 dark:bg-gray-700' : ''}`,
            noOptionsMessage: () => 'px-3 py-2 text-sm text-gray-500 dark:text-gray-400',
          }}
        />
      </label>
    </div>
  )
}