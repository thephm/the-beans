import { useTranslation } from 'react-i18next'
import { getPersonRoleLabel, getPersonRolePresentation, PERSON_ROLE_PILL_CLASSES } from '../lib/personRoles'

export default function PersonRolePill({ role }: { role: string }) {
  const { t } = useTranslation()

  return (
    <span className={`${PERSON_ROLE_PILL_CLASSES} ${getPersonRolePresentation(role).colorClasses}`}>
      {getPersonRoleLabel(role, t)}
    </span>
  )
}
