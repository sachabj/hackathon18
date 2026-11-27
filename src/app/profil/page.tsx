// Responsable : Matteo
import LogoutButton from "@/components/LogoutButton";

// TODO Tâche 10 : niveau d'activité, compteur « accès complet encore X jours », messages d'encouragement par catégorie. Tâche 11 : bouton « 📍 Simuler ma position ».
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <h1 className="text-2xl font-bold">Mon profil</h1>
      <p className="mt-2 text-sm text-zinc-500">À construire — responsable : Matteo.</p>
      <div className="mt-8">
        <LogoutButton />
      </div>
    </div>
  );
}
